"use client";
import { useState } from "react";
export default function NewsletterForm() {
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const f = e.currentTarget, r = await fetch("/api/newsletter", { method: "POST", body: JSON.stringify({ email: new FormData(f).get("email") }) });
    setMsg(r.ok ? "You're in. We'll send trip drops and Nganya updates." : (await r.json()).error ?? "Something went wrong"); setBusy(false); if (r.ok) f.reset();
  }
  return <form onSubmit={go} style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 520 }}><input name="email" type="email" required placeholder="you@example.com" aria-label="Email address" style={{ flex: "1 1 220px", margin: 0 }} /><button className="btn" disabled={busy}>Join the community</button>{msg && <p role="status" className="mut" style={{ flexBasis: "100%", margin: 0 }}>{msg}</p>}</form>;
}
