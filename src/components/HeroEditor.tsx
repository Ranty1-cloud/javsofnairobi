"use client";
import { useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { shrinkImage as shrink } from "@/lib/shrink-image";

type Item = { url: string; path: string };
export default function HeroEditor({ active: a0, library: l0 }: { active: string | null; library: Item[] }) {
  const [active, setActive] = useState(a0);
  const [library, setLibrary] = useState<Item[]>(() => (a0 && !l0.some(i => i.url === a0) ? [{ url: a0, path: "" }, ...l0] : l0));
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: File[]) {
    const imgs = files.filter(f => /^image\/(jpeg|png|webp)$/.test(f.type));
    if (!imgs.length) return setMsg({ ok: false, text: "Use JPG, PNG or WebP images." });
    setBusy(true); setMsg(null);
    try {
      let last: { url: string; library: Item[] } | null = null;
      for (const original of imgs) {
        const file = await shrink(original);
        const s = await fetch("/api/admin/hero/sign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contentType: file.type, size: file.size }) });
        const sj = await s.json().catch(() => ({}));
        if (!s.ok) throw new Error(sj.error ?? "Could not start the upload");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
        const up = await sb.storage.from(sj.bucket).uploadToSignedUrl(sj.path, sj.token, file, { contentType: file.type });
        if (up.error) throw new Error("The photo could not be uploaded. Check the Storage bucket exists and is public.");
        const r = await fetch("/api/admin/hero", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: sj.path }) });
        const rj = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(rj.error ?? "Could not publish the photo");
        last = rj;
      }
      if (last) { setActive(last.url); setLibrary(last.library); setMsg({ ok: true, text: "Published. The homepage now shows your new photo." }); }
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Upload failed" }); }
    setBusy(false);
    if (input.current) input.current.value = "";
  }
  async function use(url: string) {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/hero", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ url }) });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: "Could not switch photo" });
    setActive(url); setMsg({ ok: true, text: "Homepage photo changed." });
  }
  async function remove(url: string) {
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    setBusy(true); setMsg(null);
    const r = await fetch(`/api/admin/hero?url=${encodeURIComponent(url)}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: j.error ?? "Could not delete" });
    setLibrary(j.library); if (j.reset) setActive(null);
    setMsg({ ok: true, text: j.reset ? "Deleted. The homepage is back on the automatic photo." : "Photo deleted." });
  }
  async function auto() {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/hero", { method: "DELETE" });
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: "Could not reset" });
    setActive(null); setMsg({ ok: true, text: "Back to the automatic photo (next trip, or latest gallery image)." });
  }

  return (
    <div className="adm-grid g-1-1" style={{ alignItems: "start" }}>
      <section className="panel">
        <div className="panel-head"><h2>Live preview</h2><span className="mut">{active ? "Custom photo" : "Automatic photo"}</span></div>
        <div className="hero-sim" aria-label="Preview of the homepage hero">
          {active && <img src={active} alt="" />}
          <div><p>Travel. Experience. Connect.</p><h3>ADVENTURE.<br />CULTURE.<br /><span className="red">NAIROBI.</span></h3></div>
        </div>
        <div className="adm-actions">
          {active && <button className="btn ghost sm" disabled={busy} onClick={auto}>Use automatic photo</button>}
          <a className="btn ghost sm" href="/" target="_blank" rel="noreferrer">Open homepage ↗</a>
        </div>
        {msg && <p role="status" style={{ margin: "12px 0 0", color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</p>}
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Add photos</h2><span className="mut">{library.length} saved</span></div>
        <label className={`drop${over ? " over" : ""}`} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); if (!busy) upload([...e.dataTransfer.files]); }}>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e => upload([...(e.target.files ?? [])])} />
          <b>{busy ? "Working…" : "Drop photos here or tap to choose"}</b>
          <span>JPG, PNG or WebP up to 10 MB. We shrink large photos for you. Wide landscape shots look best. The newest upload goes live straight away.</span>
          {busy && <div className="prog" style={{ width: "60%" }}><i style={{ width: "70%" }} /></div>}
        </label>
        <p className="note" style={{ marginTop: 14 }}>Only upload photos from real JAVS trips and events, or ones you have permission to use.</p>
      </section>

      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <div className="panel-head"><h2>Photo library</h2><span className="mut">Pick any photo to make it live</span></div>
        {library.length ? (
          <div className="lib">{library.map(i => {
            const live = i.url === active;
            return (
              <div key={i.url} className={`lib-item${live ? " live" : ""}`}>
                <img src={i.url} alt="" loading="lazy" />
                <div className="lib-meta">
                  {live ? <span className="badge red">Live now</span> : <button className="btn sm" disabled={busy} onClick={() => use(i.url)}>Set as hero</button>}
                  <button className="btn ghost sm" disabled={busy} onClick={() => remove(i.url)} aria-label="Delete photo">Delete</button>
                </div>
              </div>
            );
          })}</div>
        ) : <p className="mut" style={{ margin: 0 }}>No photos yet. Upload one above and it appears here.</p>}
      </section>
    </div>
  );
}
