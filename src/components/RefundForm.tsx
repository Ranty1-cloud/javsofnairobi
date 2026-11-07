"use client";
import { useState } from "react";
import { api, errText, type Msg } from "@/lib/admin-fetch";
export default function RefundForm() {
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<Msg>(null), [rev, setRev] = useState(0);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!confirm("Record this refund and cancel the booking's tickets?")) return;
    setBusy(true); setMsg(null);
    const { ok, j } = await api("/api/admin/refund", "POST", { bookingId: String(f.get("bookingId") ?? "").trim(), reason: String(f.get("reason") ?? "").trim() });
    setBusy(false);
    setMsg(ok ? { ok: true, text: "Refund recorded. Send the M-Pesa payout from your Paybill portal." } : { ok: false, text: errText(j, "Could not record the refund. Check the booking id.") });
    if (ok) setRev(n => n + 1);
  }
  return (
    <form key={rev} onSubmit={go} className="card ev-edit stack" style={{ maxWidth: 520, marginTop: 24 }}>
      <h3 style={{ margin: 0 }}>Record a refund</h3>
      <label>Booking id <span className="mut">(the long code in the booking page address)</span></label><input name="bookingId" required />
      <label>Reason</label><input name="reason" required minLength={3} maxLength={300} />
      <button className="btn sm" disabled={busy}>{busy ? "Saving…" : "Record refund"}</button>
      {msg && <p role="status" style={{ margin: 0, color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</p>}
    </form>
  );
}
