"use client";
import { useEffect, useMemo, useState } from "react";
type Seat = { label: string; priceKes: number; status: string };
const rowOf = (l: string) => l.replace(/\d+$/, ""), numOf = (l: string) => Number(l.replace(/\D/g, ""));
export default function SeatMap({ tripId, seats, fee }: { tripId: string; seats: Seat[]; fee: number }) {
  const [step, setStep] = useState(1);
  const [sel, setSel] = useState<string[]>([]);
  const [until, setUntil] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const [phone, setPhone] = useState(""), [email, setEmail] = useState(""), [promo, setPromo] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [optIn, setOptIn] = useState(true), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const rows = useMemo(() => {
    const m = new Map<string, Seat[]>();
    [...seats].sort((a, b) => rowOf(a.label).localeCompare(rowOf(b.label)) || numOf(a.label) - numOf(b.label)).forEach(s => m.set(rowOf(s.label), [...(m.get(rowOf(s.label)) ?? []), s]));
    return [...m.values()];
  }, [seats]);
  const base = Math.min(...seats.map(s => s.priceKes));
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => { const s = Math.max(0, Math.round((until - Date.now()) / 1000)); setLeft(s); if (!s) { setSel([]); setUntil(null); setStep(1); setMsg("Your seat hold expired. Please pick your seats again."); } }, 1000);
    return () => clearInterval(t);
  }, [until]);
  const chosen = seats.filter(s => sel.includes(s.label));
  const subtotal = chosen.reduce((a, s) => a + s.priceKes, 0), sum = subtotal + (sel.length ? fee : 0);
  const toLogin = () => { window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`; }; // session expired: log in, then land back on this trip
  async function toggle(s: Seat) {
    if (s.status !== "AVAILABLE" && !sel.includes(s.label)) return;
    if (sel.includes(s.label)) {
      await fetch("/api/seats/release", { method: "POST", body: JSON.stringify({ tripId, labels: [s.label] }) });
      const next = sel.filter(l => l !== s.label); setSel(next); if (!next.length) { setUntil(null); setStep(1); } return;
    }
    const next = [...sel, s.label];
    const r = await fetch("/api/seats/hold", { method: "POST", body: JSON.stringify({ tripId, labels: next }) }), j = await r.json();
    if (r.status === 401) return toLogin();
    if (!r.ok) return setMsg(j.error ?? "Could not hold that seat");
    setMsg(""); setUntil(new Date(j.until).getTime()); setSel(next);
  }
  async function pay(method: "stk" | "manual") {
    setBusy(true); setMsg("");
    const r = await fetch("/api/payments/mpesa/stk", { method: "POST", body: JSON.stringify({ tripId, labels: sel, phone, email: email || undefined, passengers: sel.map(label => ({ label, name: names[label] ?? "" })), whatsappOptIn: optIn, promoCode: promo || undefined, method }) });
    const j = await r.json();
    if (r.status === 401) return toLogin();
    if (r.ok) window.location.href = `/booking/${j.id}`; else { setMsg(j.error ?? "Could not start payment"); setBusy(false); }
  }
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const detailsOk = sel.every(l => (names[l] ?? "").trim().length >= 2) && /^(?:254|0)[17]\d{8}$/.test(phone);
  return (
    <div className="two">
      <div>
        <div className="steps" aria-label="Booking progress">{["1 · Seats", "2 · Passengers", "3 · Review & pay"].map((l, i) => <div key={l} className={step > i ? "done" : ""}>{l}</div>)}</div>
        {until && <div className="hold-timer" role="timer">Seats held for you: <b>{mm}</b></div>}
        {msg && <p className="note" role="status">{msg}</p>}
        {step === 1 && <>
          <div className="bus"><div className="bus-front">FRONT · DRIVER</div>
            {rows.map(r => <div key={rowOf(r[0].label)} className="srow">{r.map((s, i) => {
              const mine = sel.includes(s.label), cls = mine ? "sel" : s.status === "BOOKED" ? "taken" : s.status === "RESERVED" ? "hold" : "";
              return <span key={s.label} style={{ display: "contents" }}>{i === Math.ceil(r.length / 2) && <span className="aisle" />}<button className={`seat ${cls} ${s.priceKes > base ? "prem" : ""}`} disabled={!mine && s.status !== "AVAILABLE"} aria-pressed={mine} aria-label={`Seat ${s.label}, ${s.priceKes} shillings, ${mine ? "selected" : s.status === "AVAILABLE" ? "available" : "unavailable"}`} onClick={() => toggle(s)}>{s.label}</button></span>;
            })}</div>)}
          </div>
          <div className="legend"><span><i style={{ background: "var(--elev)" }} />Available</span><span><i style={{ background: "var(--red)" }} />Selected</span><span><i style={{ background: "#2a2a2a" }} />Taken</span><span><i style={{ borderColor: "var(--amber)" }} />Held by someone</span><span><span style={{ color: "var(--amber)" }}>★</span> Premium</span></div>
        </>}
        {step === 2 && <div className="card">
          <h3>Passenger details</h3>
          {sel.map(l => <div key={l}><label htmlFor={`n${l}`}>Seat {l} passenger name</label><input id={`n${l}`} autoComplete="name" value={names[l] ?? ""} onChange={e => setNames({ ...names, [l]: e.target.value })} /></div>)}
          <label htmlFor="ph">M-Pesa / WhatsApp number</label><input id="ph" inputMode="tel" placeholder="07XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value.replace(/\s/g, ""))} />
          <label htmlFor="em">Send tickets to a different email (optional, defaults to your account email)</label><input id="em" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <label htmlFor="pr">Promo code (optional)</label><input id="pr" value={promo} onChange={e => setPromo(e.target.value)} />
          <label><input type="checkbox" checked={optIn} onChange={e => setOptIn(e.target.checked)} />Send my tickets to this number on WhatsApp</label>
        </div>}
        {step === 3 && <div className="card">
          <h3>Review &amp; pay</h3>
          <p className="mut">Seats {sel.join(", ")} for {sel.map(l => names[l]).join(", ")}. We&apos;ll send an M-Pesa prompt to <b>{phone}</b>. No hidden charges: the total below is recalculated on our server at payment.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className="btn" disabled={busy} onClick={() => pay("stk")}>{busy ? "Starting…" : "Pay with M-Pesa (STK push)"}</button><button className="btn ghost" disabled={busy} onClick={() => pay("manual")}>Pay manually via Paybill</button></div>
          <p className="mut" style={{ fontSize: ".8rem" }}>Card and international payments are not enabled yet.</p>
        </div>}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          {step > 1 && <button className="btn ghost" onClick={() => setStep(step - 1)}>← Edit</button>}
          {step === 1 && <button className="btn" disabled={!sel.length} onClick={() => setStep(2)}>Continue</button>}
          {step === 2 && <button className="btn" disabled={!detailsOk} onClick={() => setStep(3)}>Review booking</button>}
        </div>
      </div>
      <aside className="card summary" aria-label="Booking summary">
        <h3>Your booking</h3>
        <dl>
          <div><dt>Seats</dt><dd>{sel.length ? sel.join(", ") : "None yet"}</dd></div>
          <div><dt>Tickets</dt><dd>KSh {subtotal.toLocaleString()}</dd></div>
          <div><dt>Booking fee</dt><dd>KSh {(sel.length ? fee : 0).toLocaleString()}</dd></div>
          {promo && <div><dt>Promo</dt><dd>{promo.toUpperCase()} (applied at payment)</dd></div>}
          <div className="total"><dt>Total</dt><dd>KSh {sum.toLocaleString()}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
