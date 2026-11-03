"use client";
import { useState } from "react";
export default function SubmitForm({ endpoint, extra = {}, fields, label }: { endpoint: string; extra?: object; fields: string[]; label: string }) {
  const [msg, setMsg] = useState("");
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const r = await fetch(endpoint, { method: "POST", body: JSON.stringify({ ...extra, ...Object.fromEntries(new FormData(f)) }) });
    setMsg(r.ok ? "Thanks! It will appear once approved." : (await r.json()).error ?? "Failed"); if (r.ok) f.reset();
  }
  return <form onSubmit={go} style={{ maxWidth: 480 }}>{fields.map(n => n === "body" ? <textarea key={n} name={n} rows={4} placeholder="Message" required maxLength={2000} /> : <input key={n} name={n} placeholder={n} required={n !== "contact"} maxLength={200} />)}<button className="btn">{label}</button>{msg && <p role="status">{msg}</p>}</form>;
}
