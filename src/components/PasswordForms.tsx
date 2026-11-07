"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
async function post(url: string, data: unknown) {
  const r = await fetch(url, { method: "POST", body: JSON.stringify(data) });
  return { ok: r.ok, j: await r.json().catch(() => ({})) };
}
// Rough guide only. Supabase and the server enforce the real rules (10+ characters).
function score(pw: string) {
  let s = 0;
  if (pw.length >= 10) s++; if (pw.length >= 14) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const LEVEL = ["Too short", "Weak", "Okay", "Good", "Strong"];
function PasswordField({ name, label, value, onChange, meter, autoFocus }: { name: string; label: string; value: string; onChange: (v: string) => void; meter?: boolean; autoFocus?: boolean }) {
  const [show, setShow] = useState(false), s = value ? score(value) : 0;
  return (
    <div className="pw">
      <label htmlFor={name}>{label}</label>
      <div className="pw-box">
        <input id={name} name={name} type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} required minLength={10} maxLength={128} autoComplete="new-password" autoFocus={autoFocus} />
        <button type="button" className="pw-eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>{show ? "Hide" : "Show"}</button>
      </div>
      {meter && value && <div className="pw-meter" aria-live="polite"><div className="pw-bars">{[1, 2, 3, 4].map(i => <i key={i} className={i <= s ? `on l${s}` : ""} />)}</div><small>{value.length < 10 ? `${10 - value.length} more character${10 - value.length === 1 ? "" : "s"} needed` : LEVEL[s]}</small></div>}
    </div>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState(""), [sent, setSent] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);
  async function go(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault(); setBusy(true); setErr("");
    const { ok, j } = await post("/api/auth/forgot", { email });
    if (ok) { setSent(true); setWait(60); } else setErr(j.error ?? "Something went wrong");
    setBusy(false);
  }
  if (sent) return (
    <div className="auth-card" role="status">
      <h2>Check your email</h2>
      <p className="mut">If <b>{email}</b> has a JAVS account, a reset link is on its way. It expires in 1 hour. Check spam or promotions if you do not see it.</p>
      <button type="button" className="btn ghost" disabled={busy || wait > 0} onClick={() => go()}>{wait > 0 ? `Send again in ${wait}s` : busy ? "Sending…" : "Send it again"}</button>
      {err && <p role="alert" className="auth-err">{err}</p>}
      <p className="mut"><button type="button" className="linklike" onClick={() => { setSent(false); setEmail(""); }}>Use a different email</button> · <Link href="/login">Back to log in</Link></p>
    </div>
  );
  return (
    <form onSubmit={go} className="auth-card">
      <label htmlFor="email">Account email</label>
      <input id="email" name="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" autoFocus />
      <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
      {err && <p role="alert" className="auth-err">{err}</p>}
      <p className="mut" style={{ marginBottom: 0 }}><Link href="/login">Back to log in</Link></p>
    </form>
  );
}

export function ResetForm() {
  const [pw, setPw] = useState(""), [again, setAgain] = useState(""), [done, setDone] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { if (!done) return; const t = setTimeout(() => { window.location.href = "/login"; }, 4000); return () => clearTimeout(t); }, [done]);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr("");
    if (pw !== again) return setErr("The two passwords do not match");
    setBusy(true);
    const { ok, j } = await post("/api/auth/reset", { password: pw });
    ok ? setDone(true) : setErr(j.error ?? "Something went wrong"); setBusy(false);
  }
  if (done) return (
    <div className="auth-card" role="status">
      <h2>Password updated</h2>
      <p className="mut">Other devices were signed out. Taking you to log in…</p>
      <Link className="btn" href="/login">Log in now</Link>
    </div>
  );
  const mismatch = again && pw !== again;
  return (
    <form onSubmit={go} className="auth-card">
      <PasswordField name="password" label="New password" value={pw} onChange={setPw} meter autoFocus />
      <PasswordField name="confirm" label="Repeat new password" value={again} onChange={setAgain} />
      {mismatch && <small className="auth-err">Passwords do not match yet</small>}
      <button className="btn" disabled={busy || pw.length < 10 || pw !== again}>{busy ? "Saving…" : "Set new password"}</button>
      {err && <p role="alert" className="auth-err">{err}</p>}
    </form>
  );
}
