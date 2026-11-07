"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, errText, type Msg } from "@/lib/admin-fetch";

export type FleetRow = { id: string; name: string; capacity: number; shape: string; events: number };
export default function VehiclesManager({ rows }: { rows: FleetRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<Msg>(null), [rev, setRev] = useState(0), [rowsN, setRowsN] = useState(6), [per, setPer] = useState(3);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setMsg(null);
    const { ok, j } = await api("/api/admin/vehicles", "POST", { name: String(f.get("name") ?? "").trim(), rows: rowsN, perRow: per });
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not add the vehicle.") });
    setMsg({ ok: true, text: "Vehicle added. You can now put it on any event." }); setRev(n => n + 1); router.refresh();
  }
  async function remove(v: FleetRow) {
    if (!confirm(`Delete ${v.name} from the fleet?`)) return;
    setBusy(true); setMsg(null);
    const { ok, j } = await api(`/api/admin/vehicles?id=${encodeURIComponent(v.id)}`, "DELETE");
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not delete.") });
    setMsg({ ok: true, text: `${v.name} deleted.` }); router.refresh();
  }
  return (
    <>
      <section className="panel">
        <div className="panel-head"><h2>Add a vehicle</h2></div>
        <form key={rev} onSubmit={add} className="ev-edit stack" style={{ maxWidth: 520 }}>
          <label>Name <span className="mut">(e.g. 25-seater Nganya)</span></label><input name="name" required minLength={2} maxLength={60} />
          <div className="ev-cols">
            <div className="stack"><label>Rows of seats</label><input type="number" min={1} max={20} value={rowsN} onChange={e => setRowsN(Number(e.target.value))} required inputMode="numeric" /></div>
            <div className="stack"><label>Seats per row</label><input type="number" min={1} max={6} value={per} onChange={e => setPer(Number(e.target.value))} required inputMode="numeric" /></div>
          </div>
          <p className="note" style={{ margin: 0 }}>This makes {rowsN > 0 && per > 0 ? rowsN * per : 0} seats in {rowsN} rows of {per}, with the aisle in the middle of each row.</p>
          <div className="adm-actions"><button className="btn sm" disabled={busy}>{busy ? "Adding…" : "Add vehicle"}</button></div>
        </form>
        {msg && <p role="status" style={{ margin: "12px 0 0", color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</p>}
      </section>
      <section className="panel">
        <div className="panel-head"><h2>Your vehicles</h2><span className="mut">{rows.length}</span></div>
        <ul className="ev-vlist">
          {rows.map(v => (
            <li key={v.id}>
              <div><b>{v.name}</b><small className="mut">{v.capacity} seats · {v.shape} · used on {v.events} event{v.events === 1 ? "" : "s"}</small></div>
              <button type="button" className="btn ghost sm" disabled={busy || v.events > 0} title={v.events > 0 ? "Used by an event" : "Delete this vehicle"} onClick={() => remove(v)}>Delete</button>
            </li>
          ))}
        </ul>
        {!rows.length && <p className="mut" style={{ margin: 0 }}>No vehicles yet.</p>}
        <p className="note" style={{ margin: "12px 0 0" }}>To put a vehicle on an event, open Events, press Edit on the event and use &quot;Add another vehicle&quot;. This works even after the event is published.</p>
      </section>
    </>
  );
}
