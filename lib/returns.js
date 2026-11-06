/** Parse user-submitted order confirmation for return window hints. */
const KNOWN = {
  amazon: "amazon.com",
  walmart: "walmart.com",
  target: "target.com",
  "best buy": "bestbuy.com",
  bestbuy: "bestbuy.com",
  ebay: "ebay.com",
  etsy: "etsy.com",
  costco: "costco.com",
  apple: "apple.com",
  nike: "nike.com",
};

function parseOrder(text) {
  const raw = String(text || "").slice(0, 20000);
  const orderId =
    (raw.match(/(?:order\s*(?:number|id|#)\s*[:#]?\s*)([A-Z0-9\-]{6,30})/i) ||
      raw.match(/\b(\d{3}-\d{7}-\d{7})\b/) ||
      [])[1] || null;
  const dates = [
    ...raw.matchAll(
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/gi
    ),
  ].map((m) => m[0]);

  let windowDays = null;
  const win =
    raw.match(/(\d{1,3})\s*[\-\s]?day[s]?\s+(?:return|refund|exchange)/i) ||
    raw.match(/return(?:s|ing)?\s+(?:accepted\s+)?(?:within|in)\s+(\d{1,3})\s*days?/i) ||
    raw.match(/within\s+(\d{1,3})\s*days?\s+of\s+(?:delivery|purchase|receipt)/i);
  if (win) windowDays = Number(win[1]);
  const noReturn = /final\s+sale|non[\-\s]?returnable|no\s+returns/i.test(raw);

  let merchant =
    (raw.match(/(?:from|sold\s+by|merchant|store)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9 .&'\-]{1,50})/i) || [])[1] || null;
  if (merchant) merchant = merchant.trim().replace(/\s*[.,;].*$/, "");

  let domain = (raw.match(/\b([a-z0-9][a-z0-9\-.]{1,50}\.(?:com|net|org|co|io|shop))\b/i) || [])[1] || null;
  if (!domain) {
    const lower = raw.toLowerCase();
    for (const [name, host] of Object.entries(KNOWN)) {
      if (lower.includes(name)) {
        domain = host;
        if (!merchant) merchant = name.replace(/\b\w/g, (c) => c.toUpperCase());
        break;
      }
    }
  }

  // Prefer delivery date for return windows when present
  let purchaseDate = null;
  let anchorLabel = "purchase";
  const deliveryMatch = raw.match(/(?:delivered|delivery(?:\s+date)?)\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  const orderedMatch = raw.match(/(?:ordered\s+on|order\s+date|purchased)\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  const anchorRaw = deliveryMatch ? deliveryMatch[1] : orderedMatch ? orderedMatch[1] : dates[0] || null;
  if (deliveryMatch) anchorLabel = "delivery";

  let deadline = null;
  if (anchorRaw) {
    const d = new Date(anchorRaw);
    if (!isNaN(d.getTime())) {
      purchaseDate = d.toISOString().slice(0, 10);
      if (windowDays) {
        const end = new Date(d.getTime() + windowDays * 86400000);
        deadline = end.toISOString().slice(0, 10);
      }
    }
  }

  const steps = [];
  if (noReturn) {
    steps.push("This text looks like a final-sale / non-returnable order — confirm on the merchant site before assuming a return is possible.");
  } else {
    steps.push("Find the order in your merchant account or the original confirmation email.");
    steps.push("Start a return/refund from the merchant’s returns page (search “returns” on their site).");
    steps.push("Keep tracking numbers and photos of the item/packaging.");
    if (deadline) steps.push(`Aim to start the return before ${deadline} (estimated from ${anchorLabel} date + ${windowDays} days in the paste — verify).`);
    else if (windowDays) steps.push(`Text mentions a ${windowDays}-day window — confirm the exact deadline with the merchant.`);
    else steps.push("No clear day-count found in the paste — check the merchant’s return policy page.");
  }

  return {
    order_id_guess: orderId,
    merchant_guess: merchant,
    domain_guess: domain,
    purchase_date_guess: purchaseDate,
    return_window_days_guess: windowDays,
    deadline_guess: deadline,
    final_sale_hint: noReturn,
    steps,
  };
}

module.exports = { parseOrder };
