"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageField from "./ImageField";
import PlaceFields from "./PlaceFields";
import { api, errText, type Msg } from "@/lib/admin-fetch";

export type DestRow = { id: string; slug: string; name: string; region: string; description: string; imageUrl: string | null; travelTime: string; budgetNote: string; activities: string; tips: string; trips: number };

function Details({ d }: { d?: DestRow }) {
  return (
    <>
      <ImageField name="imageUrl" label="Photo" folder="destinations" initial={d?.imageUrl ?? ""} />
      <label>About this place</label><textarea name="description" defaultValue={d?.description} rows={5} maxLength={5000} placeholder="Leave a blank line between paragraphs." />
      <label>Travel time from Nairobi <span className="mut">(optional)</span></label><input name="travelTime" defaultValue={d?.travelTime} maxLength={80} placeholder="e.g. 2 hours by road" />
      <label>Estimated budget <span className="mut">(optional)</span></label><input name="budgetNote" defaultValue={d?.budgetNote} maxLength={120} placeholder="e.g. KSh 3,000 to 6,000" />
      <label>Activities <span className="mut">(separate with commas)</span></label><input name="activities" defaultValue={d?.activities} maxLength={300} placeholder="Boat ride, hiking, camping" />
      <label>Travel tips <span className="mut">(optional)</span></label><textarea name="tips" defaultValue={d?.tips} rows={3} maxLength={600} />
    </>
  );
}
const read = (f: FormData) => { const s = (k: string) => String(f.get(k) ?? "").trim(); return { description: s("description"), imageUrl: s("imageUrl") || null, travelTime: s("travelTime"), budgetNote: s("budgetNote"), activities: s("activities"), tips: s("tips") }; };

export default function DestinationsManager({ rows }: { rows: DestRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null), [adding, setAdding] = useState(false), [busy, setBusy] = useState(false), [msg, setMsg] = useState<Msg>(null), [rev, setRev] = useState(0);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setMsg(null);
    const { ok, j } = await api("/api/admin/destinations", "POST", { county: String(f.get("county") ?? ""), town: String(f.get("town") ?? "").trim(), ...read(f) });
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not add the place.") });
    setMsg({ ok: true, text: "Place added. It shows on the Destinations page." }); setRev(n => n + 1); setAdding(false); router.refresh();
  }
  async function save(e: React.FormEvent<HTMLFormElement>, d: DestRow) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { ok, j } = await api("/api/admin/destinations", "PATCH", { id: d.id, ...read(new FormData(e.currentTarget)) });
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not save.") });
    setMsg({ ok: true, text: `${d.name} saved.` }); setOpen(null); router.refresh();
  }
  async function remove(d: DestRow) {
    if (!confirm(`Delete ${d.name}? This cannot be undone.`)) return;
    setBusy(true); setMsg(null);
    const { ok, j } = await api(`/api/admin/destinations?id=${encodeURIComponent(d.id)}`, "DELETE");
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not delete.") });
    setMsg({ ok: true, text: `${d.name} deleted.` }); setOpen(null); router.refresh();
  }
  return (
    <>
      <section className="panel">
        <div className="panel-head"><h2>Add a place</h2><button type="button" className="btn ghost sm" onClick={() => setAdding(!adding)} aria-expanded={adding}>{adding ? "Close" : "+ New place"}</button></div>
        {adding && <form key={rev} onSubmit={create} className="ev-edit stack" style={{ maxWidth: 520 }}><PlaceFields /><Details /><div className="adm-actions"><button className="btn sm" disabled={busy}>{busy ? "Saving…" : "Add place"}</button></div></form>}
        {msg && <p role="status" style={{ margin: "12px 0 0", color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</p>}
        <p className="note" style={{ margin: "12px 0 0" }}>Places are added automatically when you create an event with a county and town. Use this page to write the description, add a photo, or remove places you no longer use.</p>
      </section>
      <section className="panel">
        <div className="panel-head"><h2>All places</h2><span className="mut">{rows.length}</span></div>
        <ul className="ev-list">
          {rows.map(d => (
            <li key={d.id} className="ev">
              <div className="ev-row" style={{ gridTemplateColumns: "84px minmax(0,1fr) auto" }}>
                <div className="ev-thumb">{d.imageUrl ? <img src={d.imageUrl} alt="" loading="lazy" /> : <span>No photo</span>}</div>
                <div className="ev-main"><b>{d.name}</b><small className="mut">{d.region || "No county set"} · {d.trips} event{d.trips === 1 ? "" : "s"}</small>
                  <div className="ev-chips">{!d.description.trim() && <span className="badge amber">No description</span>}{!d.region.endsWith(" County") && <span className="badge amber">No county</span>}</div></div>
                <div className="ev-acts"><button className="btn ghost sm" onClick={() => setOpen(open === d.id ? null : d.id)} aria-expanded={open === d.id}>{open === d.id ? "Close" : "Edit"}</button></div>
              </div>
              {open === d.id && <div className="ev-more"><form onSubmit={e => save(e, d)} className="ev-edit stack" style={{ maxWidth: 520 }}><Details d={d} /><div className="adm-actions"><button className="btn sm" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div></form>
                <div className="adm-actions"><a className="btn ghost sm" href={`/destinations/${d.slug}`} target="_blank" rel="noreferrer">View on site ↗</a><button type="button" className="btn ghost sm" disabled={busy || d.trips > 0} title={d.trips > 0 ? "Move its events to another place first" : "Delete this place"} onClick={() => remove(d)}>Delete place</button></div>
                {d.trips > 0 && <p className="note" style={{ margin: "8px 0 0" }}>To delete this place, first change the county or town on its {d.trips} event{d.trips === 1 ? "" : "s"} in Events.</p>}</div>}
            </li>
          ))}
        </ul>
        {!rows.length && <p className="mut" style={{ margin: 0 }}>No places yet.</p>}
      </section>
    </>
  );
}
