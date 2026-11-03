"use client";
import { useEffect, useState } from "react";
type Seat = { label: string; priceKes: number; status: string };
const color: Record<string, string> = { AVAILABLE: "#171717", RESERVED: "#d9a400", BOOKED: "#3a3a3a" };
export default function SeatMap({ tripId, seats, fee }: { tripId: string; seats: Seat[]; fee: number }) {
  const [sel, setSel] = useState<string[]>([]);
  const [until, setUntil] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => { if (!until) return; const t = setInterval(() => { const s = Math.max(0, Math.round((until - Date.now()) / 1000)); setLeft(s); if (!s) { setSel([]); setUntil(null); setMsg("Hold expired"); } }, 1000); return () => clearInterval(t); }, [until]);
  const sum = seats.filter(s => sel.includes(s.label)).reduce((a, s) => a + s.priceKes, 0) + (sel.length ? fee : 0);
  async function toggle(s: Seat) {
    if (s.status === "BOOKED") return;
    const next = sel.includes(s.label) ? sel.filter(l => l !== s.label) : [...sel, s.label];
    if (!sel.includes(s.label)) {
      const r = await fetch("/api/seats/hold", { method: "POST", body: JSON.stringify({ tripId, labels: next }) });
      const j = await r.json();
      if (!r.ok) return setMsg(j.error);
      setUntil(new Date(j.until).getTime());
    } else await fetch("/api/seats/release", { method: "POST", body: JSON.stringify({ tripId, labels: [s.label] }) });
    setMsg(""); setSel(next);
  }
  async function pay() {
    const r = await fetch("/api/payments/mpesa/stk", { method: "POST", body: JSON.stringify({ tripId, labels: sel, phone, passengers: sel.map(label => ({ label, name: names[label] ?? "" })) }) });
    const j = await r.json();
    if (r.ok) window.location.href = `/booking/${j.id}`; else setMsg(j.error ?? "Could not start payment");
  }
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,56px)", gap: 10, margin: "20px 0" }}>
        {seats.map(s => <button key={s.label} onClick={() => toggle(s)} disabled={s.status === "BOOKED"} aria-label={`Seat ${s.label}`}
          style={{ height: 56, borderRadius: 10, border: "1px solid #292929", color: "#fff", cursor: "pointer", background: sel.includes(s.label) ? "#E50914" : color[s.status] }}>{s.label}</button>)}
      </div>
      <p style={{ color: "#A1A1A1" }}>Dark = available, red = yours, grey = taken</p>
      {sel.length > 0 && <>
        <p>Seats {sel.join(", ")}: <b style={{ color: "#E50914" }}>KSh {sum.toLocaleString()}</b> (incl. KSh {fee} booking fee). Held for {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</p>
        {sel.map(l => <input key={l} placeholder={`Passenger name, seat ${l}`} value={names[l] ?? ""} onChange={e => setNames({ ...names, [l]: e.target.value })} />)}
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XXXXXXXX" style={{ padding: 12, borderRadius: 8 }} />
        <button onClick={pay} style={{ marginLeft: 8, padding: "12px 20px", background: "#E50914", color: "#fff", border: 0, borderRadius: 8 }}>Pay with M-Pesa</button>
      </>}
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}
