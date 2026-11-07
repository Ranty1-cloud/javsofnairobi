"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { shrinkImage } from "@/lib/shrink-image";
import { GALLERY_CATS } from "@/lib/gallery";

export type Photo = { id: string; url: string; caption: string; category: string };
type Msg = { ok: boolean; text: string } | null;
const headers = { "content-type": "application/json" };

function Item({ p, onMsg }: { p: Photo; onMsg: (m: Msg) => void }) {
  const router = useRouter();
  const [caption, setCaption] = useState(p.caption), [cat, setCat] = useState(p.category), [busy, setBusy] = useState(false);
  async function patch(body: object) {
    setBusy(true);
    const r = await fetch("/api/admin/gallery", { method: "PATCH", headers, body: JSON.stringify({ id: p.id, ...body }) });
    setBusy(false);
    onMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: "Could not save that change." });
    if (r.ok) router.refresh();
  }
  async function del() {
    if (!confirm("Delete this photo from the gallery? This cannot be undone.")) return;
    setBusy(true);
    const r = await fetch(`/api/admin/gallery?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
    setBusy(false);
    onMsg(r.ok ? { ok: true, text: "Photo deleted." } : { ok: false, text: "Could not delete the photo." });
    if (r.ok) router.refresh();
  }
  return (
    <div className="lib-item">
      <img src={p.url} alt={p.caption || p.category} loading="lazy" />
      <div className="lib-meta" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <select value={cat} disabled={busy} aria-label="Category" style={{ margin: 0 }} onChange={e => { setCat(e.target.value); patch({ category: e.target.value }); }}>{GALLERY_CATS.map(c => <option key={c}>{c}</option>)}</select>
        <input value={caption} disabled={busy} maxLength={200} placeholder="Caption (optional)" aria-label="Caption" style={{ margin: 0 }} onChange={e => setCaption(e.target.value)} onBlur={() => { if (caption !== p.caption) patch({ caption }); }} />
        <button className="btn ghost sm" disabled={busy} onClick={del}>Delete</button>
      </div>
    </div>
  );
}

export default function GalleryManager({ photos }: { photos: Photo[] }) {
  const router = useRouter();
  const [cat, setCat] = useState<string>(GALLERY_CATS[0]), [busy, setBusy] = useState(false), [over, setOver] = useState(false), [msg, setMsg] = useState<Msg>(null), [progress, setProgress] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function upload(files: File[]) {
    const imgs = files.filter(f => /^image\/(jpeg|png|webp)$/.test(f.type));
    if (!imgs.length) return setMsg({ ok: false, text: "Use JPG, PNG or WebP photos." });
    setBusy(true); setMsg(null);
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    let done = 0, failed = "";
    for (const [i, original] of imgs.entries()) {
      setProgress(`Uploading ${i + 1} of ${imgs.length}…`);
      try {
        const file = await shrinkImage(original);
        const s = await fetch("/api/admin/upload/sign", { method: "POST", headers, body: JSON.stringify({ folder: "gallery", contentType: file.type, size: file.size }) });
        const sj = await s.json().catch(() => ({}));
        if (!s.ok) throw new Error(sj.error ?? "Could not start the upload");
        const up = await sb.storage.from(sj.bucket).uploadToSignedUrl(sj.path, sj.token, file, { contentType: file.type });
        if (up.error) throw new Error("Upload failed. Check the Storage bucket exists and is public.");
        const r = await fetch("/api/admin/gallery", { method: "POST", headers, body: JSON.stringify({ url: sj.url, category: cat }) });
        if (!r.ok) throw new Error("The photo uploaded but could not be added to the gallery.");
        done++;
      } catch (e) { failed = e instanceof Error ? e.message : "Upload failed"; }
    }
    setBusy(false); setProgress("");
    setMsg(done === imgs.length ? { ok: true, text: `${done} photo${done === 1 ? "" : "s"} added to ${cat}. They are live on the gallery now.` } : { ok: false, text: `${done} of ${imgs.length} added. ${failed}` });
    if (input.current) input.current.value = "";
    if (done) router.refresh();
  }

  return (
    <>
      <section className="panel">
        <div className="panel-head"><h2>Add photos</h2><span className="mut">{photos.length} in the gallery</span></div>
        <label className="mut" style={{ fontSize: ".8rem" }}>Put the new photos in this category</label>
        <select value={cat} onChange={e => setCat(e.target.value)} disabled={busy} aria-label="Category for new photos">{GALLERY_CATS.map(c => <option key={c}>{c}</option>)}</select>
        <label className={`drop${over ? " over" : ""}`} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); if (!busy) upload([...e.dataTransfer.files]); }}>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={e => upload([...(e.target.files ?? [])])} />
          <b>{busy ? progress || "Working…" : "Drop photos here or tap to choose (many at once is fine)"}</b>
          <span>JPG, PNG or WebP up to 10 MB each. We shrink big photos for you. Only use photos from real JAVS trips and events, or ones you have permission to use.</span>
        </label>
        {msg && <p role="status" style={{ margin: "12px 0 0", color: msg.ok ? "#6ee39a" : "#ff6b73" }}>{msg.text}</p>}
      </section>
      <section className="panel">
        <div className="panel-head"><h2>All photos</h2><span className="mut">The 6 newest also show on the homepage</span></div>
        {photos.length ? <div className="lib">{photos.map(p => <Item key={p.id} p={p} onMsg={setMsg} />)}</div> : <p className="mut" style={{ margin: 0 }}>No photos yet. Add your first ones above.</p>}
      </section>
    </>
  );
}
