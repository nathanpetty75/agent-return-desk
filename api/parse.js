const { parseOrder } = require("../lib/returns");
module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const text = body && body.text;
  if (!text || String(text).trim().length < 10) return res.status(400).json({ error: "Paste an order confirmation (min 10 chars)." });
  const parsed = parseOrder(text);
  res.status(200).json({
    disclaimer: "Automated guess from text you pasted only. Not legal advice. Deadlines may be wrong — verify with the merchant. We do not store your paste on the server in this MVP.",
    parsed,
  });
};
