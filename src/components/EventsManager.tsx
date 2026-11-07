"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageField from "./ImageField";
import PlaceFields from "./PlaceFields";
import EventVehicles, { type EventVehicle, type FleetItem } from "./EventVehicles";

export type EventRow = {
  id: string; slug: string; title: string; category: string; tripType: string; durationLabel: string; summary: string;
  imageUrl: string | null; departsAt: string; meetingPoint: string; priceKes: number; published: boolean; placeholder: boolean;
  vehicles: EventVehicle[]; destination: string; county: string; town: string; booked: number; seats: number; bookings: number; pinned: boolean;
};
type Msg = { ok: boolean; text: string } | null;
type Reply = { error?: unknown; notified?: number };

// datetime-local inputs have no timezone. Nairobi is UTC+3 all year, so convert explicitly instead of trusting the browser's zone.
const toInput = (iso: string) => new Date(new Date(iso).getTime() + 3 * 3_600_000).toISOString().slice(0, 16);
const fromInput = (v: string) => new Date(`${v}:00+03:00`).toISOString();
const when = (iso: string) => new Date(iso).toLocaleString("en-KE", { timeZone: "Africa/Nairobi", weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

async function call(url: string, method: string, body?: object): Promise<{ ok: boolean; j: Reply }> {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j: Reply = await r.json().catch(() => ({}));
  return { ok: r.ok, j };
}

function Editor({ e, onDone }: { e: EventRow; onDone: (m: Msg) => void }) {
  const [busy, setBusy] = useState(false);
  async function save(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget), body: Record<string, unknown> = {};
    const put = (k: string, v: FormDataEntryValue | null, old: string) => { const s = String(v ?? "").trim(); if (s && s !== old) body[k] = s; };
    put("title", f.get("title"), e.title); put("category", f.get("category"), e.category); put("tripType", f.get("tripType"), e.tripType);
    put("meetingPoint", f.get("meetingPoint"), e.meetingPoint); put("imageUrl", f.get("imageUrl"), e.imageUrl ?? "");
    const dur = String(f.get("durationLabel") ?? "").trim(); if (dur !== e.durationLabel) body.durationLabel = dur;
    const sum = String(f.get("summary") ?? "").trim(); if (sum !== e.summary) body.summary = sum;
    const cty = String(f.get("county") ?? ""), twn = String(f.get("town") ?? "").trim();
    if (cty && (cty !== e.county || twn !== e.town)) { body.county = cty; body.town = twn; }
    const dep = String(f.get("departsAt") ?? ""); if (dep && dep !== toInput(e.departsAt)) body.departsAt = fromInput(dep);
    if (!Object.keys(body).length) return onDone({ ok: true, text: "Nothing changed." });
    body.notify = f.get("notify") === "on";
    setBusy(true);
    const { ok, j } = await call(`/api/admin/trips/${e.id}`, "PATCH", body);
    setBusy(false);
    onDone(ok ? { ok: true, text: `${e.title} saved.${body.notify ? ` Passengers messaged: ${j.notified ?? 0}.` : ""}` } : { ok: false, text: typeof j.error === "string" ? j.error : "Could not save. Check the fields." });
  }
  return (
    <form onSubmit={save} className="ev-edit stack">
      <div className="ev-cols">
        <div className="stack"><PlaceFields county={e.county} town={e.town} required={false} />
          {!e.county && <p className="note" style={{ margin: 0 }}>This event has no county yet. Choose one so it shows the right place.</p>}
          <label>Name</label><input name="title" defaultValue={e.title} required minLength={3} maxLength={120} />
          <label>Category</label><input name="category" defaultValue={e.category} required minLength={2} maxLength={60} placeholder="e.g. Road trip, Nganya event, Resort" />
          <label>Trip type</label><select name="tripType" defaultValue={e.tripType}><option value="DAY">Day trip</option><option value="OVERNIGHT">Overnight</option><option value="WEEKEND">Weekend</option></select>
          <label>Duration</label><input name="durationLabel" defaultValue={e.durationLabel} maxLength={60} placeholder="e.g. 1 day, 2 days" /></div>
        <div className="stack"><label>Departure (Nairobi time)</label><input name="departsAt" type="datetime-local" defaultValue={toInput(e.departsAt)} required />
          <label>Meeting point</label><input name="meetingPoint" defaultValue={e.meetingPoint} required minLength={2} maxLength={160} />
          <ImageField name="imageUrl" label="Cover photo" folder="trips" initial={e.imageUrl ?? ""} />
          <label>Short description</label><textarea name="summary" defaultValue={e.summary} rows={4} maxLength={600} /></div>
      </div>
      <label className="mut" style={{ fontSize: ".85rem" }}><input type="checkbox" name="notify" style={{ width: "auto", marginRight: 8 }} />If I changed the date or meeting point, WhatsApp the confirmed passengers</label>
      <p className="note" style={{ margin: 0 }}>Seat prices ({`KSh ${e.priceKes.toLocaleString("en-KE")}`}) are fixed when an event is created. To change the price, create a new event.</p>
      <div className="adm-actions"><button className="btn sm" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
    </form>
  );
}

export default function EventsManager({ rows, fleet }: { rows: EventRow[]; fleet: FleetItem[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>([]), [open, setOpen] = useState<string | null>(null), [busy, setBusy] = useState(false), [msg, setMsg] = useState<Msg>(null);
  const [filter, setFilter] = useState<"all" | "live" | "draft" | "past">("all");
  const now = Date.now();
  const status = (r: EventRow) => (!r.published ? "draft" : new Date(r.departsAt).getTime() < now ? "past" : "live");
  const shown = rows.filter(r => filter === "all" || status(r) === filter);
  const counts = { all: rows.length, live: rows.filter(r => status(r) === "live").length, draft: rows.filter(r => status(r) === "draft").length, past: rows.filter(r => status(r) === "past").length };
  const toggleSel = (id: string) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  const allOn = shown.length > 0 && shown.every(r => sel.includes(r.id));

  async function setPublished(ids: string[], published: boolean) {
    if (!ids.length) return;
    if (published && rows.some(r => ids.includes(r.id) && r.placeholder) && !confirm("Some of these events are unreviewed drafts. Publish anyway? You can edit them after.")) return;
    setBusy(true); setMsg(null);
    const { ok, j } = await call("/api/admin/events", "PATCH", { ids, published });
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: typeof j.error === "string" ? j.error : "Could not update" });
    setMsg({ ok: true, text: `${ids.length} event${ids.length === 1 ? "" : "s"} ${published ? "published. They are live on the website now." : "unpublished. They are hidden from the website."}` });
    setSel([]); router.refresh();
  }
  async function pin(r: EventRow) {
    setBusy(true); setMsg(null);
    const { ok, j } = await call("/api/admin/events/pin", "POST", { id: r.id, pinned: !r.pinned });
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: typeof j.error === "string" ? j.error : "Could not update" });
    setMsg({ ok: true, text: r.pinned ? "Unpinned from the homepage." : "Pinned. It now shows first on the homepage." }); router.refresh();
  }
  async function remove(r: EventRow) {
    if (!confirm(`Delete "${r.title}" for good? This cannot be undone.`)) return;
    setBusy(true); setMsg(null);
    const { ok, j } = await call(`/api/admin/events?id=${encodeURIComponent(r.id)}`, "DELETE");
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: typeof j.error === "string" ? j.error : "Could not delete" });
    setMsg({ ok: true, text: "Event deleted." }); setOpen(null); router.refresh();
  }

  return (
    <section className="panel">
      <div className="ev-bar">
        <div className="pills" role="group" aria-label="Filter events">{(["all", "live", "draft", "past"] as const).map(k => <button key={k} type="button" className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{k === "all" ? "All" : k === "live" ? "Live" : k === "draft" ? "Not published" : "Past"} {counts[k]}</button>)}</div>
        <div className="adm-actions" style={{ margin: 0 }}>
          <button className="btn sm" disabled={busy || !sel.length} onClick={() => setPublished(sel, true)}>Publish selected{sel.length ? ` (${sel.length})` : ""}</button>
          <button className="btn ghost sm" disabled={busy || !sel.length} onClick={() => setPublished(sel, false)}>Unpublish selected</button>
        </div>
      </div>
      {msg && <p role="status" style={{ margin: "0 0 12px", color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</p>}
      {shown.length > 0 && <label className="ev-all"><input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? [] : shown.map(r => r.id))} /> Select all shown</label>}
      <ul className="ev-list">
        {shown.map(r => { const st = status(r); return (
          <li key={r.id} className={`ev${sel.includes(r.id) ? " sel" : ""}`}>
            <div className="ev-row">
              <input type="checkbox" checked={sel.includes(r.id)} onChange={() => toggleSel(r.id)} aria-label={`Select ${r.title}`} />
              <div className="ev-thumb">{r.imageUrl ? <img src={r.imageUrl} alt="" loading="lazy" /> : <span>No photo</span>}</div>
              <div className="ev-main">
                <b>{r.title}</b>
                <small className="mut">{r.destination} · {when(r.departsAt)}</small>
                <small className="mut">{r.booked}/{r.seats} seats booked · {r.bookings} booking{r.bookings === 1 ? "" : "s"}</small>
                <div className="ev-chips">
                  <span className={`badge ${st === "live" ? "red" : st === "past" ? "" : "amber"}`}>{st === "live" ? "Live" : st === "past" ? "Past" : "Not published"}</span>
                  {r.pinned && <span className="badge red">Pinned</span>}
                  {r.placeholder && <span className="badge amber">Placeholder text</span>}
                </div>
              </div>
              <div className="ev-acts">
                {r.published ? <button className="btn ghost sm" disabled={busy} onClick={() => setPublished([r.id], false)}>Unpublish</button> : <button className="btn sm" disabled={busy} onClick={() => setPublished([r.id], true)}>Publish</button>}
                {r.published && st !== "past" && <button className="btn ghost sm" disabled={busy} onClick={() => pin(r)}>{r.pinned ? "Unpin" : "Pin to homepage"}</button>}
                <button className="btn ghost sm" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>{open === r.id ? "Close" : "Edit"}</button>
              </div>
            </div>
            {open === r.id && <div className="ev-more"><Editor e={r} onDone={m => { setMsg(m); if (m?.ok) { setOpen(null); router.refresh(); } }} />
              <EventVehicles tripId={r.id} priceKes={r.priceKes} vehicles={r.vehicles} fleet={fleet} />
              <div className="adm-actions"><a className="btn ghost sm" href={`/trips/${r.slug}`} target="_blank" rel="noreferrer">View on site ↗</a>
                <button type="button" className="btn ghost sm" disabled={busy || r.bookings > 0} title={r.bookings > 0 ? "Has bookings: unpublish instead" : "Delete this event"} onClick={() => remove(r)}>Delete event</button></div></div>}
          </li>
        ); })}
      </ul>
      {!shown.length && <p className="mut" style={{ margin: 0 }}>{rows.length ? "No events in this view." : "No events yet. Create your first one with New event."}</p>}
    </section>
  );
}
