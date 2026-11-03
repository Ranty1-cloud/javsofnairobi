"use client";
import { useMemo, useState } from "react";

export default function HeroEditor({ current }: { current: string | null }) {
  const [url, setUrl] = useState(current);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : url), [file, url]);

  async function save() {
    if (!file) return;
    setBusy(true); setMsg("");
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/admin/hero", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(j.error ?? "Upload failed");
    setUrl(j.url); setFile(null); setMsg("Homepage photo updated.");
  }
  async function reset() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/hero", { method: "DELETE" });
    setBusy(false);
    if (!r.ok) return setMsg("Could not reset");
    setUrl(null); setFile(null); setMsg("Back to the automatic photo (next trip or latest gallery image).");
  }

  return (
    <div className="adm-card">
      <h2>Homepage hero photo</h2>
      <p className="mut" style={{ margin: 0 }}>JPG, PNG or WebP, under 4 MB. A wide landscape photo works best.</p>
      {preview ? <img className="adm-hero-preview" src={preview} alt="Hero preview" /> : <div className="adm-hero-preview" />}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <div className="adm-actions">
        <button className="btn" disabled={!file || busy} onClick={save}>{busy ? "Working…" : "Upload and publish"}</button>
        {url && <button className="btn ghost" disabled={busy} onClick={reset}>Use automatic photo</button>}
        {msg && <span className="mut">{msg}</span>}
      </div>
    </div>
  );
}
