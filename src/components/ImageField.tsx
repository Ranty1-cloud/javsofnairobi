"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { shrinkImage } from "@/lib/shrink-image";

// A form field that holds an image URL. Staff can upload a photo (drag/choose) or paste an existing link.
// Renders a plain <input name=...> so it works inside any FormData-based form.
export default function ImageField({ name, label, folder, required = false, initial = "" }: { name: string; label: string; folder: "trips" | "articles" | "destinations" | "nganya" | "gallery"; required?: boolean; initial?: string }) {
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(f: File | undefined) {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return setErr("Use a JPG, PNG or WebP image.");
    setBusy(true); setErr("");
    try {
      const file = await shrinkImage(f);
      const s = await fetch("/api/admin/upload/sign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ folder, contentType: file.type, size: file.size }) });
      const sj = await s.json().catch(() => ({}));
      if (!s.ok) throw new Error(sj.error ?? "Could not start the upload");
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
      const up = await sb.storage.from(sj.bucket).uploadToSignedUrl(sj.path, sj.token, file, { contentType: file.type });
      if (up.error) throw new Error("Upload failed. Check the Storage bucket exists and is public.");
      setUrl(sj.url);
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed"); }
    setBusy(false);
  }

  return (
    <div className="imgf">
      <label>{label}</label>
      {url && <img className="imgf-prev" src={url} alt="" />}
      <div className="imgf-row">
        <input name={name} value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste an image link, or upload" required={required} aria-label={label} />
        <label className={`btn sm dark imgf-btn${busy ? " off" : ""}`}>{busy ? "Uploading…" : "Upload"}<input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} disabled={busy} onChange={e => { upload(e.target.files?.[0]); e.target.value = ""; }} /></label>
      </div>
      {err && <small role="alert" style={{ color: "#ff6b73" }}>{err}</small>}
    </div>
  );
}
