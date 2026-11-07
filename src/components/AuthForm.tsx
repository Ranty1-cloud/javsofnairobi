"use client";
import { useState } from "react";
export default function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [err, setErr] = useState(""), [msg, setMsg] = useState("");
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(data) });
    const j = await r.json();
    if (r.ok && j.confirm) setMsg(j.message); else if (r.ok) window.location.href = next ?? (j.role && j.role !== "CUSTOMER" ? "/admin" : "/trips"); else setErr(j.error ?? "Failed");
  }
  return (
    <form onSubmit={go} style={{ maxWidth: 380 }}>
      {mode === "register" && <input name="name" placeholder="Full name" required />}
      <input name="email" type="email" placeholder="Email" required />
      {mode === "register" && <input name="phone" placeholder="Phone (optional)" />}
      <input name="password" type="password" placeholder={mode === "register" ? "Password (10+ characters)" : "Password"} required minLength={mode === "register" ? 10 : 1} />
      <button className="btn" type="submit">{mode === "login" ? "Log in" : "Create account"}</button>
      {msg && <p role="status" className="mut">{msg} <a href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Go to log in</a></p>}
      {err && <p role="alert" style={{ color: "#E50914" }}>{err}</p>}
    </form>
  );
}
