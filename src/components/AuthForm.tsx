"use client";
import { useEffect, useState } from "react";
export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [err, setErr] = useState(""), [msg, setMsg] = useState("");
  const [waiting, setWaiting] = useState<string | null>(null); // an address whose confirmation email we can resend
  const [wait, setWait] = useState(0), [note, setNote] = useState("");
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(w => w - 1), 1000); return () => clearTimeout(t); }, [wait]);
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setMsg(""); setNote("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(data) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.confirm) { setMsg(j.message); setWaiting(String(data.email).toLowerCase()); setWait(60); }
    else if (r.ok) { const n = new URLSearchParams(window.location.search).get("next") ?? ""; window.location.href = n.startsWith("/") && !n.startsWith("//") ? n : j.role && j.role !== "CUSTOMER" ? "/admin" : "/trips"; }
    else { setErr(j.error ?? "Failed"); if (r.status === 403 && /confirm your email/i.test(j.error ?? "")) { setWaiting(String(data.email).toLowerCase()); setWait(0); } } // logged in before confirming: offer a fresh email
  }
  async function resend() {
    if (!waiting || wait > 0) return;
    setWait(60); setNote("");
    const r = await fetch("/api/auth/resend", { method: "POST", body: JSON.stringify({ email: waiting }) });
    const j = await r.json().catch(() => ({}));
    setNote(j.message ?? j.error ?? "Could not send. Please try again in a minute.");
  }
  return (
    <form onSubmit={go} style={{ maxWidth: 380 }}>
      {mode === "register" && <input name="name" placeholder="Full name" required />}
      <input name="email" type="email" placeholder="Email" required />
      {mode === "register" && <input name="phone" placeholder="Phone (optional)" />}
      <input name="password" type="password" placeholder={mode === "register" ? "Password (10+ characters)" : "Password"} required minLength={mode === "register" ? 10 : 1} />
      <button className="btn" type="submit">{mode === "login" ? "Log in" : "Create account"}</button>
      {msg && <p role="status" className="mut">{msg}</p>}
      {err && <p role="alert" style={{ color: "#E50914" }}>{err}</p>}
      {waiting && (
        <div className="card" style={{ marginTop: 12 }}>
          <button type="button" className="btn ghost sm" disabled={wait > 0} onClick={resend}>{wait > 0 ? `Resend email in ${wait}s` : "Resend confirmation email"}</button>
          {note && <p role="status" className="mut" style={{ margin: "10px 0 0" }}>{note}</p>}
          <p className="mut" style={{ fontSize: ".85rem", margin: "10px 0 0" }}>Nothing yet? Check spam or promotions. Already confirmed? <a href="/login">Log in</a> or <a href="/forgot">reset your password</a>.</p>
        </div>
      )}
    </form>
  );
}
