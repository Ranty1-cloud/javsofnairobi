"use client";
import { useState } from "react";
import ImageField from "./ImageField";
type F = [string, string, string]; // name, label, kind: text|number|datetime|textarea|bool|dest|veh
type Opt = { id: string; name: string };
const FORMS: { title: string; endpoint: string; type?: string; fields: F[] }[] = [
  { title: "New trip", endpoint: "/api/admin/trips", fields: [["title", "Title", "text"], ["slug", "Slug (a-z, 0-9, -)", "text"], ["category", "Category", "text"], ["destinationId", "Destination", "dest"], ["vehicleId", "Vehicle", "veh"], ["departsAt", "Departure", "datetime"], ["meetingPoint", "Meeting point", "text"], ["tripType", "Trip type", "tripType"], ["durationLabel", "Duration (e.g. 1 day, 2 nights)", "text"], ["imageUrl", "Cover image", "image:trips"], ["summary", "Short description", "textarea"], ["priceKes", "Price KSh", "number"], ["premiumPriceKes", "Premium row price KSh", "number"], ["bookingFeeKes", "Booking fee KSh", "number"], ["published", "Published", "bool"]] },
  { title: "New article", endpoint: "/api/admin/content", type: "article", fields: [["title", "Title", "text"], ["slug", "Slug", "text"], ["category", "Category (Nganya, Travel, Events, Guides)", "text"], ["excerpt", "Excerpt", "text"], ["body", "Body (blank line between paragraphs)", "textarea"], ["coverUrl", "Cover image", "image:articles"], ["author", "Author", "text"], ["publishedAt", "Publish at (blank = draft)", "datetime"]] },
  { title: "New destination", endpoint: "/api/admin/content", type: "destination", fields: [["name", "Name", "text"], ["slug", "Slug", "text"], ["description", "Description", "textarea"], ["lat", "Latitude", "number"], ["lng", "Longitude", "number"], ["imageUrl", "Cover image", "image:destinations"], ["region", "Region (e.g. Rift Valley)", "text"], ["travelTime", "Travel time from Nairobi", "text"], ["budgetNote", "Estimated budget", "text"], ["activities", "Activities (comma separated)", "text"], ["tips", "Travel tips", "textarea"]] },
  { title: "Add Nganya", endpoint: "/api/admin/content", type: "nganya", fields: [["name", "Matatu name", "text"], ["crew", "Crew", "text"], ["bio", "About", "textarea"], ["imageUrl", "Photo", "image:nganya"]] },
  { title: "Add gallery image", endpoint: "/api/admin/content", type: "gallery", fields: [["url", "Photo", "image:gallery"], ["caption", "Caption", "text"], ["category", "Category", "text"]] },
  { title: "New promo code", endpoint: "/api/admin/promo", fields: [["code", "Code", "text"], ["percentOff", "Percent off", "number"], ["maxUses", "Max uses", "number"], ["expiresAt", "Expires", "datetime"]] },
  { title: "Record refund", endpoint: "/api/admin/refund", fields: [["bookingId", "Booking id (from booking URL)", "text"], ["reason", "Reason", "text"]] },
];
function One({ f, dest, veh }: { f: (typeof FORMS)[number]; dest: Opt[]; veh: Opt[] }) {
  const [msg, setMsg] = useState("");
  const [rev, setRev] = useState(0);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget), body: Record<string, unknown> = f.type ? { type: f.type } : {};
    for (const [n, , k] of f.fields) { const v = fd.get(n); if (k === "bool") body[n] = v === "on"; else if (v !== null && v !== "") body[n] = k === "number" ? Number(v) : k === "datetime" ? new Date(String(v)).toISOString() : v; }
    const r = await fetch(f.endpoint, { method: "POST", body: JSON.stringify(body) });
    if (r.ok) { setMsg("Saved"); setRev(n => n + 1); } else setMsg(JSON.stringify((await r.json()).error ?? "Failed"));
  }
  return (
    <form key={rev} onSubmit={go} className="card" style={{ marginBottom: 16 }}>
      <h3>{f.title}</h3>
      {f.fields.map(([n, l, k]) => k.startsWith("image:") ? <ImageField key={n} name={n} label={l} folder={k.slice(6) as "trips"} required={f.type === "gallery"} /> : k === "textarea" ? <textarea key={n} name={n} placeholder={l} rows={4} /> : k === "bool" ? <label key={n}><input type="checkbox" name={n} style={{ width: "auto", marginRight: 8 }} />{l}</label> : k === "tripType" ? <select key={n} name={n} defaultValue="DAY"><option value="DAY">Day trip</option><option value="OVERNIGHT">Overnight</option><option value="WEEKEND">Weekend</option></select> : k === "dest" || k === "veh" ? <select key={n} name={n} required><option value="">{l}</option>{(k === "dest" ? dest : veh).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select> : <input key={n} name={n} placeholder={l} type={k === "number" ? "number" : k === "datetime" ? "datetime-local" : "text"} title={l} />)}
      <button className="btn">Save</button>{msg && <p role="status">{msg}</p>}
    </form>
  );
}
export default function AdminForms({ dest, veh }: { dest: Opt[]; veh: Opt[] }) { return <div>{FORMS.map(f => <One key={f.title} f={f} dest={dest} veh={veh} />)}</div>; }
