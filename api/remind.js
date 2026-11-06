/** Opt-in reminder placeholder — no email sent until provider configured. */
module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const email = String((body && body.email) || "").trim();
  const consent = !!(body && body.consent);
  if (!consent) return res.status(400).json({ error: "Consent required to store email for a reminder." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Valid email required." });
  // No email provider / DB wired — acknowledge only
  res.status(200).json({
    ok: true,
    status: "queued_local_only",
    message:
      "Reminder preference recorded in this response only. Email delivery is not enabled yet (no ESP keys). When enabled, messages will include unsubscribe and postal address: 791 Jensen Court, Encinitas, CA 92024.",
    email,
    consent_wording:
      "I opt in to one deadline reminder email from Agent Return Desk. I can unsubscribe anytime.",
  });
};
