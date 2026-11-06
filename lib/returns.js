/** Parse user-submitted order confirmation for return window hints. */
function parseOrder(text) {
  const raw = String(text || "").slice(0, 20000);
  const orderId = (raw.match(/(?:order\s*(?:#|number|id)?\s*[:#]?\s*)([A-Z0-9\-]{6,24})/i) || [])[1] || null;
  const dates = [...raw.matchAll(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b/gi)].map((m) => m[0]);
  let windowDays = null;
  const win = raw.match(/(\d{1,3})\s*[\-\s]?day[s]?\s+(?:return|refund|exchange)/i) || raw.match(/return(?:s|ing)?\s+(?:within|in)\s+(\d{1,3})\s*days?/i);
  if (win) windowDays = Number(win[1]);
  const noReturn = /final\s+sale|non[\-\s]?returnable|no\s+returns/i.test(raw);
  const merchant = (raw.match(/(?:from|sold\s+by|merchant|store)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9 .&'\-]{1,50})/i) || [])[1] || null;
  const domain = (raw.match(/\b([a-z0-9][a-z0-9\-.]{1,50}\.(?:com|net|org|co|io|shop))\b/i) || [])[1] || null;

  let deadline = null;
  let purchaseDate = null;
  if (dates.length) {
    const d = new Date(dates[0]);
    if (!isNaN(d.getTime())) {
      purchaseDate = d.toISOString().slice(0, 10);
      if (windowDays) {
        const end = new Date(d.getTime() + windowDays * 86400000);
        deadline = end.toISOString().slice(0, 10);
      }
    }
  }

  const steps = [];
  if (noReturn) steps.push("This text looks like a final-sale / non-returnable order — confirm on the merchant site before assuming a return is possible.");
  else {
    steps.push("Find the order in your merchant account or the original confirmation email.");
    steps.push("Start a return/refund from the merchant’s returns page (search “returns” on their site).");
    steps.push("Keep tracking numbers and photos of the item/packaging.");
    if (deadline) steps.push(`Aim to start the return before ${deadline} (estimated from the pasted text — verify).`);
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
