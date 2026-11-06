const out = document.getElementById("out");
document.getElementById("go").addEventListener("click", async () => {
  const text = document.getElementById("paste").value;
  out.innerHTML = "<p class='muted'>Parsing…</p>";
  const r = await fetch("/api/parse", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ text }) });
  const j = await r.json();
  if (!r.ok) { out.innerHTML = `<p>${j.error}</p>`; return; }
  const p = j.parsed;
  out.innerHTML = `<div class="card">
    <p class="muted">${j.disclaimer}</p>
    <p><b>Order id guess:</b> ${p.order_id_guess || "—"} · <b>Merchant:</b> ${p.merchant_guess || "—"} · <b>Domain:</b> ${p.domain_guess || "—"}</p>
    <p><b>Purchase date guess:</b> ${p.purchase_date_guess || "—"} · <b>Window:</b> ${p.return_window_days_guess != null ? p.return_window_days_guess + " days" : "—"} · <b>Deadline guess:</b> ${p.deadline_guess || "—"}</p>
    ${p.final_sale_hint ? "<p style='color:#b42318'><b>Final-sale / no-return language detected</b></p>" : ""}
    <h3>Suggested steps</h3><ol>${(p.steps||[]).map(s=>`<li>${s}</li>`).join("")}</ol>
  </div>`;
});
document.getElementById("remind").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const consent = document.getElementById("consent").checked;
  const r = await fetch("/api/remind", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email, consent }) });
  const j = await r.json();
  document.getElementById("remind-out").textContent = j.message || j.error || JSON.stringify(j);
});
