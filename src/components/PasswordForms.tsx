"use client";
import Link from "next/link";
import { useState } from "react";
async function post(url: string, data: unknown) {
  const r = await fetch(url, { method: "POST", body: JSON.stringify(data) });
  return { ok: r.ok, j: await r.json().catch(() => ({})) };
}
export function ForgotForm() {
  const [msg, setMsg] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr(""); setMsg("");
    const { ok, j } = await post("/api/auth/forgot", { email: new FormData(e.currentTarget).get("email") });
    ok ? setMsg(j.message) : setErr(j.error ?? "Something went wrong"); setBusy(false);
  }
  return <form onSubmit={go} style={{ maxWidth: 380 }}><input name="email" type="email" placeholder="Your account email" required autoComplete="email" /><button className="btn" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>{msg && <p role="status" className="mut">{msg}</p>}{err && <p role="alert" style={{ color: "#E50914" }}>{err}</p>}</form>;
}
export function ResetForm({ token }: { token: string }) {
  const [done, setDone] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr("");
    const f = new FormData(e.currentTarget), pw = String(f.get("password"));
    if (pw !== f.get("confirm")) return setErr("The two passwords do not match");
    setBusy(true);
    const { ok, j } = await post("/api/auth/reset", { token, password: pw });
    ok ? setDone(true) : setErr(j.error ?? "Something went wrong"); setBusy(false);
  }
  if (done) return <div className="card" style={{ maxWidth: 380 }}><b>Password updated.</b><p className="mut">You can log in with your new password now.</p><Link className="btn" href="/login">Log in</Link></div>;
  return <form onSubmit={go} style={{ maxWidth: 380 }}><input name="password" type="password" placeholder="New password (10+ characters)" required minLength={10} autoComplete="new-password" /><input name="confirm" type="password" placeholder="Repeat new password" required minLength={10} autoComplete="new-password" /><button className="btn" disabled={busy}>{busy ? "Saving…" : "Set new password"}</button>{err && <p role="alert" style={{ color: "#E50914" }}>{err}</p>}</form>;
}
