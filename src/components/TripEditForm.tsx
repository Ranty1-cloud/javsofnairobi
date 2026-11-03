"use client";
import { useState } from "react";
export default function TripEditForm({ trips }: { trips: { id: string; title: string }[] }) {
  const [msg, setMsg] = useState("");
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget), body: Record<string, unknown> = { notify: f.get("notify") === "on" };
    if (f.get("departsAt")) body.departsAt = new Date(String(f.get("departsAt"))).toISOString();
    if (f.get("meetingPoint")) body.meetingPoint = f.get("meetingPoint");
    if (f.get("published")) body.published = f.get("published") === "yes";
    const r = await fetch(`/api/admin/trips/${f.get("id")}`, { method: "PATCH", body: JSON.stringify(body) });
    const j = await r.json(); setMsg(r.ok ? `Saved. Passengers messaged: ${j.notified}` : JSON.stringify(j.error));
  }
  return <form onSubmit={go} className="card"><h3>Edit trip</h3><select name="id" required><option value="">Choose trip</option>{trips.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select><input name="departsAt" type="datetime-local" title="New departure" /><input name="meetingPoint" placeholder="New meeting point" /><select name="published" defaultValue=""><option value="">Published: unchanged</option><option value="yes">Publish</option><option value="no">Unpublish</option></select><label><input type="checkbox" name="notify" style={{ width: "auto", marginRight: 8 }} />WhatsApp confirmed passengers about the change</label><br /><button className="btn">Save</button>{msg && <p role="status">{msg}</p>}</form>;
}
