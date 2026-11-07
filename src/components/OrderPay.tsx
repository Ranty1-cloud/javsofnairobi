"use client";
import { useState } from "react";
import { isPayerName, PAYER_NAME_HELP } from "@/lib/payer-name";

export default function OrderPay({ id, till, reference, amount, code: sent, payerName }: { id: string; till: string; reference: string; amount: number; code: string | null; payerName: string | null }) {
  const [code, setCode] = useState(""), [name, setName] = useState(payerName ?? ""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  async function go() {
    if (!isPayerName(name)) return setMsg(PAYER_NAME_HELP);
    setBusy(true); setMsg("");
    const r = await fetch(`/api/shop/orders/${id}/pay`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, payerName: name }) });
    if (r.ok) return window.location.reload();
    setBusy(false); setMsg((await r.json().catch(() => ({}))).error ?? "Failed");
  }
  async function cancel() {
    if (!confirm("Cancel this order?")) return;
    const r = await fetch(`/api/shop/orders/${id}/cancel`, { method: "POST" });
    if (r.ok) window.location.reload(); else setMsg((await r.json().catch(() => ({}))).error ?? "Could not cancel");
  }
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3>Pay with M-Pesa Till</h3>
      <ol style={{ paddingLeft: 20, margin: "0 0 12px", lineHeight: 1.7 }}>
        <li>Open M-Pesa and choose <b>Lipa na M-Pesa</b>, then <b>Buy Goods and Services</b>.</li>
        <li>Enter Till number <b style={{ fontSize: "1.15rem", letterSpacing: ".08em" }}>{till}</b>.</li>
        <li>Enter the exact amount: <b>KSh {amount.toLocaleString()}</b>.</li>
        <li>Enter your M-Pesa PIN and send. You will get an M-Pesa message with a 10-character code.</li>
        <li>Type that code below, with your name as it appears on your M-Pesa, so we can confirm your order.</li>
      </ol>
      <p className="mut" style={{ fontSize: ".85rem" }}>Your order reference is <b>{reference}</b>.</p>
      {sent ? <p>Code <b>{sent}</b>{payerName ? <> from <b>{payerName.toUpperCase()}</b></> : null} received. We are checking it and will confirm your order shortly.</p> : null}
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name on M-Pesa, e.g. John Kamau" autoComplete="name" maxLength={80} aria-label="Name on your M-Pesa (at least two names)" />
      <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="M-Pesa code e.g. SJK4ABC123" maxLength={10} aria-label="M-Pesa confirmation code" />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className="btn" onClick={go} disabled={busy}>{sent ? "Update code" : "Submit code"}</button>{!sent && <button className="btn ghost" onClick={cancel}>Cancel order</button>}</div>
      {msg && <p role="alert" style={{ color: "#E50914" }}>{msg}</p>}
      {!sent && <p className="mut" style={{ fontSize: ".8rem" }}>Items are held for 24 hours. If we haven't received a payment code by then, the order is released.</p>}
    </div>
  );
}
