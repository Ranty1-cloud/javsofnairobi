"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageField from "./ImageField";
import { api, errText, type Msg } from "@/lib/admin-fetch";

export type NganyaRow = { id: string; name: string; crew: string; bio: string; imageUrl: string | null };
function Form({ n, onDone }: { n?: NganyaRow; onDone: (m: Msg) => void }) {
  const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget), s = (k: string) => String(f.get(k) ?? "").trim();
    const body: Record<string, unknown> = { name: s("name"), crew: s("crew"), bio: s("bio"), imageUrl: s("imageUrl") || null };
    if (n) body.id = n.id;
    setBusy(true);
    const { ok, j } = await api("/api/admin/nganya", n ? "PATCH" : "POST", body);
    setBusy(false);
    onDone(ok ? { ok: true, text: n ? `${n.name} saved.` : "Nganya added to the showcase." } : { ok: false, text: errText(j, "Could not save.") });
  }
  return (
    <form onSubmit={go} className="ev-edit stack" style={{ maxWidth: 520 }}>
      <label>Matatu name</label><input name="name" defaultValue={n?.name} required minLength={2} maxLength={80} />
      <label>Crew or owner <span className="mut">(optional)</span></label><input name="crew" defaultValue={n?.crew} maxLength={80} />
      <label>About</label><textarea name="bio" defaultValue={n?.bio} rows={4} required minLength={3} maxLength={3000} />
      <ImageField name="imageUrl" label="Photo" folder="nganya" initial={n?.imageUrl ?? ""} />
      <div className="adm-actions"><button className="btn sm" disabled={busy}>{busy ? "Saving…" : n ? "Save changes" : "Add Nganya"}</button></div>
    </form>
  );
}
export default function NganyaManager({ rows }: { rows: NganyaRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null), [adding, setAdding] = useState(!rows.length), [busy, setBusy] = useState(false), [msg, setMsg] = useState<Msg>(null);
  const done = (m: Msg) => { setMsg(m); if (m?.ok) { setOpen(null); setAdding(false); router.refresh(); } };
  async function remove(n: NganyaRow) {
    if (!confirm(`Remove ${n.name} from the showcase? This cannot be undone.`)) return;
    setBusy(true); setMsg(null);
    const { ok, j } = await api(`/api/admin/nganya?id=${encodeURIComponent(n.id)}`, "DELETE");
    setBusy(false);
    if (!ok) return setMsg({ ok: false, text: errText(j, "Could not remove.") });
    setMsg({ ok: true, text: "Removed." }); setOpen(null); router.refresh();
  }
  return (
    <>
      <section className="panel">
        <div className="panel-head"><h2>Add a Nganya</h2><button type="button" className="btn ghost sm" onClick={() => setAdding(!adding)} aria-expanded={adding}>{adding ? "Close" : "+ New Nganya"}</button></div>
        {adding && <Form onDone={done} />}
        {msg && <p role="status" style={{ margin: "12px 0 0", color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</p>}
      </section>
      <section className="panel">
        <div className="panel-head"><h2>Showcase</h2><span className="mut">{rows.length}</span></div>
        <ul className="ev-list">
          {rows.map(n => (
            <li key={n.id} className="ev">
              <div className="ev-row" style={{ gridTemplateColumns: "84px minmax(0,1fr) auto" }}>
                <div className="ev-thumb">{n.imageUrl ? <img src={n.imageUrl} alt="" loading="lazy" /> : <span>No photo</span>}</div>
                <div className="ev-main"><b>{n.name}</b><small className="mut">{n.crew || "No crew listed"}</small></div>
                <div className="ev-acts"><button className="btn ghost sm" onClick={() => setOpen(open === n.id ? null : n.id)} aria-expanded={open === n.id}>{open === n.id ? "Close" : "Edit"}</button></div>
              </div>
              {open === n.id && <div className="ev-more"><Form n={n} onDone={done} /><div className="adm-actions"><button type="button" className="btn ghost sm" disabled={busy} onClick={() => remove(n)}>Remove from showcase</button></div></div>}
            </li>
          ))}
        </ul>
        {!rows.length && <p className="mut" style={{ margin: 0 }}>Nothing in the showcase yet.</p>}
      </section>
    </>
  );
}
