"use client";
import { useState } from "react";
export default function ManualPay({ id, till, reference, amount, submitted }: { id: string; till: string; reference: string; amount: number; submitted: string | null }) {
  const [code, setCode] = useState(""), [msg, setMsg] = useState("");
  async function go() {
    const r = await fetch("/api/payments/manual/submit", { method: "POST", body: JSON.stringify({ id, code }) });
    if (r.ok) window.location.reload(); else setMsg((await r.json()).error ?? "Failed");
  }
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3>Pay with M-Pesa Till</h3>
      <ol style={{ paddingLeft: 20, margin: "0 0 12px", lineHeight: 1.7 }}>
        <li>Open M-Pesa and choose <b>Lipa na M-Pesa</b>, then <b>Buy Goods and Services</b>.</li>
        <li>Enter Till number <b style={{ fontSize: "1.15rem", letterSpacing: ".08em" }}>{till}</b>.</li>
        <li>Enter the exact amount: <b>KSh {amount.toLocaleString()}</b>.</li>
        <li>Enter your M-Pesa PIN and send. You will get an M-Pesa message with a 10-character code.</li>
        <li>Type that code below so we can confirm your seats.</li>
      </ol>
      <p className="mut" style={{ fontSize: ".85rem" }}>Your booking reference is <b>{reference}</b>. Keep it handy in case you need help.</p>
      {submitted ? <p>Code <b>{submitted}</b> received. We are checking it and will confirm your booking shortly.</p> : null}
      <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="M-Pesa code e.g. SJK4ABC123" maxLength={10} aria-label="M-Pesa confirmation code" />
      <button className="btn" onClick={go}>{submitted ? "Update code" : "Submit code"}</button>{msg && <p role="alert" style={{ color: "#E50914" }}>{msg}</p>}
    </div>
  );
}
