"use client";
import { useEffect, useMemo, useState } from "react";
import { TILL, STK_ENABLED } from "@/lib/pay";
import { planSeats, type Plan } from "@/lib/layout";
type Seat = { label: string; priceKes: number; status: string };
// One entry per vehicle on the event. Labels of later vehicles carry a prefix (2-A1) so every seat label is unique for the event.
export type Group = { id: string; name: string; prefix: string; plan?: Plan; seats: Seat[] };
const rowOf = (l: string) => l.replace(/\d+$/, ""), numOf = (l: string) => Number(l.match(/(\d+)$/)?.[1] ?? 0);
export default function SeatMap({ tripId, groups, fee, signedIn, email: accountEmail, next }: { tripId: string; groups: Group[]; fee: number; signedIn: boolean; email: string; next: string }) {
  const [active, setActive] = useState(0);
  const g = groups[active] ?? groups[0], seats = g.seats, plan = g.plan;
  const allSeats = useMemo(() => groups.flatMap(x => x.seats), [groups]);
  const [step, setStep] = useState(1);
  const [sel, setSel] = useState<string[]>([]);
  const [until, setUntil] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const [phone, setPhone] = useState(""), [promo, setPromo] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [optIn, setOptIn] = useState(true), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const rows = useMemo(() => {
    const m = new Map<string, Seat[]>();
    [...seats].sort((a, b) => rowOf(a.label).localeCompare(rowOf(b.label)) || numOf(a.label) - numOf(b.label)).forEach(s => m.set(rowOf(s.label), [...(m.get(rowOf(s.label)) ?? []), s]));
    return [...m.values()];
  }, [seats]);
  const base = Math.min(...allSeats.map(s => s.priceKes));
  // Events created before a vehicle got its plan keep the seats they were made with, so only draw the plan when it matches exactly.
  const bySeat = useMemo(() => new Map(seats.map(s => [s.label, s])), [seats]);
  const usePlan = !!plan && planSeats(plan).length === seats.length && planSeats(plan).every(p => bySeat.has(g.prefix + p.label));
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => { const s = Math.max(0, Math.round((until - Date.now()) / 1000)); setLeft(s); if (!s) { setSel([]); setUntil(null); setStep(1); setMsg("Your seat hold expired. Please pick your seats again."); } }, 1000);
    return () => clearInterval(t);
  }, [until]);
  const seatBtn = (s: Seat) => {
    const mine = sel.includes(s.label), cls = mine ? "sel" : s.status === "BOOKED" ? "taken" : s.status === "RESERVED" ? "hold" : "";
    return <button key={s.label} className={`seat ${cls} ${s.priceKes > base ? "prem" : ""}`} disabled={!signedIn || (!mine && s.status !== "AVAILABLE")} aria-pressed={mine} aria-label={`Seat ${s.label}, ${s.priceKes} shillings, ${mine ? "selected" : s.status === "AVAILABLE" ? "available" : "unavailable"}`} onClick={() => toggle(s)}>{s.label.slice(g.prefix.length)}</button>;
  };
  const chosen = allSeats.filter(s => sel.includes(s.label));
  const subtotal = chosen.reduce((a, s) => a + s.priceKes, 0), sum = subtotal + (sel.length ? fee : 0);
  async function toggle(s: Seat) {
    if (!signedIn) return;
    if (s.status !== "AVAILABLE" && !sel.includes(s.label)) return;
    if (sel.includes(s.label)) {
      await fetch("/api/seats/release", { method: "POST", body: JSON.stringify({ tripId, labels: [s.label] }) });
      const next = sel.filter(l => l !== s.label); setSel(next); if (!next.length) { setUntil(null); setStep(1); } return;
    }
    const next = [...sel, s.label];
    const r = await fetch("/api/seats/hold", { method: "POST", body: JSON.stringify({ tripId, labels: next }) }), j = await r.json();
    if (!r.ok) return setMsg(j.error ?? "Could not hold that seat");
    setMsg(""); setUntil(new Date(j.until).getTime()); setSel(next);
  }
  async function pay(method: "stk" | "manual") {
    setBusy(true); setMsg("");
    const r = await fetch("/api/payments/mpesa/stk", { method: "POST", body: JSON.stringify({ tripId, labels: sel, phone, passengers: sel.map(label => ({ label, name: names[label] ?? "" })), whatsappOptIn: optIn, promoCode: promo || undefined, method }) });
    const j = await r.json();
    if (r.ok) window.location.href = `/booking/${j.id}`; else { setMsg(j.error ?? "Could not start payment"); setBusy(false); }
  }
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const detailsOk = sel.every(l => (names[l] ?? "").trim().length >= 2) && /^(?:254|0)[17]\d{8}$/.test(phone);
  return (
    <div className="two">
      <div>
        <div className="steps" aria-label="Booking progress">{["1 · Seats", "2 · Passengers", "3 · Review & pay"].map((l, i) => <div key={l} className={step > i ? "done" : ""}>{l}</div>)}</div>
        {!signedIn && <div className="gate" role="note"><div><b>Log in to book</b><p className="mut" style={{ margin: "4px 0 0" }}>You need a free account to book seats. It keeps your tickets in one place. You can look at the seats below first.</p></div><div className="gate-acts"><a className="btn sm" href={`/login?next=${encodeURIComponent(next)}`}>Log in</a><a className="btn ghost sm" href={`/register?next=${encodeURIComponent(next)}`}>Create account</a></div></div>}
        {until && <div className="hold-timer" role="timer">Seats held for you: <b>{mm}</b></div>}
        {msg && <p className="note" role="status">{msg}</p>}
        {step === 1 && <>
          {groups.length > 1 && <>
            <div className="vtabs" role="tablist" aria-label="Choose your vehicle">{groups.map((x, i) => { const free = x.seats.filter(s => s.status === "AVAILABLE").length; return <button key={x.id} type="button" role="tab" aria-selected={i === active} className={i === active ? "on" : ""} disabled={sel.length > 0 && i !== active} onClick={() => setActive(i)}>{x.name}<small>{free} seat{free === 1 ? "" : "s"} left</small></button>; })}</div>
            {sel.length > 0 && <p className="note" style={{ marginTop: 0 }}>All seats in one booking must be in the same vehicle. Remove your seats to switch vehicle.</p>}
          </>}
          <div className="bus"><div className="bus-front">{groups.length > 1 ? `${g.name.toUpperCase()} · ` : ""}FRONT · DRIVER</div>
            {usePlan ? plan!.map(r => { let col = 0; return <div key={r.row} className="srow">{[...r.cells].map((ch, k) => {
              if (ch === "|") return <span key={k} className="aisle" />;
              col++;
              const s = ch === "S" ? bySeat.get(`${g.prefix}${r.row}${col}`) : undefined;
              if (s) return seatBtn(s);
              return ch === "D" ? <span key={k} className="seat drv" aria-label="Driver" title="Driver">🛞</span> : <span key={k} className="seat gap" aria-hidden="true" />;
            })}</div>; }) : (
            rows.map(r => <div key={rowOf(r[0].label)} className="srow">{r.map((s, i) => {
              return <span key={s.label} style={{ display: "contents" }}>{i === Math.ceil(r.length / 2) && <span className="aisle" />}{seatBtn(s)}</span>;
            })}</div>)
            )}
          </div>
          <div className="legend"><span><i style={{ background: "var(--elev)" }} />Available</span><span><i style={{ background: "var(--red)" }} />Selected</span><span><i style={{ background: "#2a2a2a" }} />Taken</span><span><i style={{ borderColor: "var(--amber)" }} />Held by someone</span><span><span style={{ color: "var(--amber)" }}>★</span> Premium</span></div>
        </>}
        {step === 2 && <div className="card">
          <h3>Passenger details</h3>
          {sel.map(l => <div key={l}><label htmlFor={`n${l}`}>Seat {l} passenger name</label><input id={`n${l}`} autoComplete="name" value={names[l] ?? ""} onChange={e => setNames({ ...names, [l]: e.target.value })} /></div>)}
          <label htmlFor="ph">M-Pesa / WhatsApp number</label><input id="ph" inputMode="tel" placeholder="07XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value.replace(/\s/g, ""))} />
          <p className="mut" style={{ fontSize: ".85rem", margin: "4px 0" }}>Your booking is saved to your account ({accountEmail}).</p>
          <label htmlFor="pr">Promo code (optional)</label><input id="pr" value={promo} onChange={e => setPromo(e.target.value)} />
          <label><input type="checkbox" checked={optIn} onChange={e => setOptIn(e.target.checked)} />Send my tickets to this number on WhatsApp</label>
        </div>}
        {step === 3 && <div className="card">
          <h3>Review &amp; pay</h3>
          <p className="mut">Seats {sel.join(", ")} for {sel.map(l => names[l]).join(", ")}. We&apos;ll keep these seats for you while you pay. No hidden charges: the total is recalculated on our server at payment.</p>
          <div className="paybox">
            <button className="btn" disabled={busy} onClick={() => pay("manual")}>{busy ? "Starting…" : `Pay with M-Pesa Till ${TILL}`}</button>
            <p className="mut" style={{ fontSize: ".85rem", margin: "10px 0 0" }}>You will get the steps and the exact amount on the next page. Pay from the M-Pesa menu, then enter your M-Pesa code so we can confirm your seats.</p>
          </div>
          {STK_ENABLED
            ? <div style={{ marginTop: 12 }}><button className="btn ghost" disabled={busy} onClick={() => pay("stk")}>Pay with an M-Pesa prompt (STK push)</button></div>
            : <div className="soon" role="note"><span className="badge amber">Coming soon</span><span><b>M-Pesa STK push</b>: a payment prompt sent straight to your phone. For now, please pay to our Till.</span></div>}
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
          {groups.length > 1 && <div><dt>Vehicle</dt><dd>{g.name}</dd></div>}
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
