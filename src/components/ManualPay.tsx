"use client";
import { useState } from "react";
export default function ManualPay({ id, paybill, reference, amount, submitted }: { id: string; paybill: string; reference: string; amount: number; submitted: string | null }) {
  const [code, setCode] = useState(""), [msg, setMsg] = useState("");
  async function go() {
    const r = await fetch("/api/payments/manual/submit", { method: "POST", body: JSON.stringify({ id, code }) });
    if (r.ok) window.location.reload(); else setMsg((await r.json()).error ?? "Failed");
  }
  if (!paybill) return <p className="mut">Manual payment is not configured yet. Please use the M-Pesa prompt option.</p>;
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3>Pay via M-Pesa Paybill</h3>
      <p>Go to M-Pesa, Lipa na M-Pesa, Paybill.<br />Business no: <b>{paybill}</b><br />Account no: <b>{reference}</b><br />Amount: <b>KSh {amount.toLocaleString()}</b> (exact)</p>
      {submitted ? <p>Code <b>{submitted}</b> received. We are verifying it and will confirm shortly.</p> : <p className="mut">Payments sent to this paybill with the account number above are often confirmed automatically. You can also enter your M-Pesa confirmation code:</p>}
      <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="M-Pesa code e.g. SJK4ABC123" maxLength={10} />
      <button className="btn" onClick={go}>{submitted ? "Update code" : "Submit code"}</button>{msg && <p role="alert" style={{ color: "#E50914" }}>{msg}</p>}
    </div>
  );
}
