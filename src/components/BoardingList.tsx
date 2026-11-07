"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
export type Row = { id: string; seat: string; vehicle: string; name: string; ref: string; phone: string | null; at: string | null };

export default function BoardingList({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState(""), [busy, setBusy] = useState<string | null>(null), [err, setErr] = useState("");
  const shown = useMemo(() => { const s = q.trim().toLowerCase(); return s ? rows.filter(r => `${r.name} ${r.seat} ${r.vehicle} ${r.ref} ${r.phone ?? ""}`.toLowerCase().includes(s)) : rows; }, [rows, q]);
  async function toggle(r: Row) {
    setBusy(r.id); setErr("");
    const res = await fetch("/api/admin/checkin/manual", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticketId: r.id, undo: !!r.at }) });
    if (!res.ok) setErr((await res.json().catch(() => ({}))).error ?? "Could not update");
    setBusy(null); router.refresh();
  }
  return (
    <>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, seat, reference or phone" aria-label="Search passengers" style={{ marginBottom: 12 }} />
      {err && <p role="alert" style={{ color: "#ff6b73" }}>{err}</p>}
      <table className="tbl"><thead><tr><th>Seat</th><th>Passenger</th><th>Booking</th><th /></tr></thead><tbody>
        {shown.map(r => (
          <tr key={r.id}>
            <td><b>{r.seat}</b>{r.vehicle && <small className="mut" style={{ display: "block" }}>{r.vehicle}</small>}</td>
            <td>{r.name}{r.phone && <><br /><small className="mut">{r.phone}</small></>}</td>
            <td><small className="mut">{r.ref}</small></td>
            <td style={{ textAlign: "right" }}>{r.at
              ? <button className="btn ghost sm" disabled={busy === r.id} onClick={() => toggle(r)} title="Tap to undo">✓ Boarded {new Date(r.at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" })}</button>
              : <button className="btn sm" disabled={busy === r.id} onClick={() => toggle(r)}>Check in</button>}</td>
          </tr>
        ))}
      </tbody></table>
      {!shown.length && <p className="mut">{rows.length ? "No one matches that search." : "No confirmed passengers yet."}</p>}
    </>
  );
}
