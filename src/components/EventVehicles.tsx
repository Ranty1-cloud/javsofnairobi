"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, errText, type Msg } from "@/lib/admin-fetch";

export type EventVehicle = { id: string; name: string; type: string; position: number; seats: number; booked: number; held: number };
export type FleetItem = { id: string; name: string; capacity: number };
// Add or remove vehicles on an event, also while it is live. Customers choose their vehicle on the trip page.
export default function EventVehicles({ tripId, priceKes, vehicles, fleet }: { tripId: string; priceKes: number; vehicles: EventVehicle[]; fleet: FleetItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState<Msg>(null), [rev, setRev] = useState(0);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget), s = (k: string) => String(f.get(k) ?? "").trim();
    const body: Record<string, unknown> = { tripId, vehicleId: s("vehicleId"), priceKes: Number(s("priceKes")) };
    if (s("name")) body.name = s("name");
    if (s("premiumPriceKes")) body.premiumPriceKes = Number(s("premiumPriceKes"));
    setBusy(true); setMsg(null);
    const { ok, j } = await api("/api/admin/events/vehicles", "POST", body);
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not add the vehicle.") });
    setMsg({ ok: true, text: "Vehicle added. Customers can now choose it on the trip page." }); setRev(n => n + 1); router.refresh();
  }
  async function rename(v: EventVehicle) {
    const name = prompt("Name for this vehicle", v.name)?.trim();
    if (!name || name === v.name) return;
    setBusy(true); setMsg(null);
    const { ok, j } = await api("/api/admin/events/vehicles", "PATCH", { id: v.id, name });
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not rename.") });
    setMsg({ ok: true, text: "Renamed." }); router.refresh();
  }
  async function remove(v: EventVehicle) {
    if (!confirm(`Remove ${v.name} from this event? Its empty seats will disappear.`)) return;
    setBusy(true); setMsg(null);
    const { ok, j } = await api(`/api/admin/events/vehicles?id=${encodeURIComponent(v.id)}`, "DELETE");
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not remove.") });
    setMsg({ ok: true, text: `${v.name} removed.` }); router.refresh();
  }
  return (
    <div className="ev-veh">
      <h4 style={{ margin: "0 0 8px" }}>Vehicles for this event</h4>
      <ul className="ev-vlist">
        {vehicles.map(v => (
          <li key={v.id}>
            <div><b>{v.name}</b><small className="mut">{v.type} · {v.booked} of {v.seats} seats booked{v.held ? ` · ${v.held} held` : ""}</small></div>
            <div className="adm-actions" style={{ margin: 0 }}>
              <button type="button" className="btn ghost sm" disabled={busy} onClick={() => rename(v)}>Rename</button>
              <button type="button" className="btn ghost sm" disabled={busy || v.position === 0 || v.booked + v.held > 0} title={v.position === 0 ? "The first vehicle cannot be removed" : v.booked + v.held > 0 ? "Has booked or held seats" : "Remove this vehicle"} onClick={() => remove(v)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <form key={rev} onSubmit={add} className="ev-edit stack" style={{ marginTop: 12, maxWidth: 520 }}>
        <label>Add another vehicle</label>
        <select name="vehicleId" required defaultValue=""><option value="" disabled>Choose a vehicle</option>{fleet.map(f => <option key={f.id} value={f.id}>{f.name} ({f.capacity} seats)</option>)}</select>
        <label>Name shown to customers <span className="mut">(optional, e.g. the matatu&apos;s name)</span></label><input name="name" maxLength={60} />
        <div className="ev-cols">
          <div className="stack"><label>Seat price (KSh)</label><input name="priceKes" type="number" min={1} step={1} defaultValue={priceKes} required inputMode="numeric" /></div>
          <div className="stack"><label>Front-row price <span className="mut">(optional)</span></label><input name="premiumPriceKes" type="number" min={1} step={1} inputMode="numeric" /></div>
        </div>
        <div className="adm-actions"><button className="btn sm" disabled={busy || !fleet.length}>{busy ? "Adding…" : "Add vehicle"}</button><a className="btn ghost sm" href="/admin/vehicles">Manage vehicles</a></div>
      </form>
      {msg && <p role="status" style={{ margin: "8px 0 0", color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</p>}
    </div>
  );
}
