"use client";
import { useState } from "react";
export default function ReviewForm({ token }: { token: string }) {
  const [msg, setMsg] = useState("");
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch("/api/reviews", { method: "POST", body: JSON.stringify({ token, rating: Number(d.rating), body: d.body }) });
    setMsg(r.ok ? "Thanks! Your review will appear after approval." : (await r.json()).error ?? "Failed");
  }
  return <form onSubmit={go} className="no-print" style={{ maxWidth: 340, marginTop: 16 }}><h3>Rate your trip</h3><select name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}</select><textarea name="body" rows={3} required maxLength={1000} placeholder="How was it?" /><button className="btn">Submit review</button>{msg && <p role="status">{msg}</p>}</form>;
}
