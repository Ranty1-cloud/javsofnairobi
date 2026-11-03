"use client";
import { useEffect, useState } from "react";
export default function Countdown({ to }: { to: string }) {
  const [t, setT] = useState(0);
  useEffect(() => { const f = () => setT(Math.max(0, new Date(to).getTime() - Date.now())); f(); const i = setInterval(f, 1000); return () => clearInterval(i); }, [to]);
  const d = Math.floor(t / 864e5), h = Math.floor(t / 36e5) % 24, m = Math.floor(t / 6e4) % 60, s = Math.floor(t / 1e3) % 60;
  return <b style={{ color: "#E50914", fontSize: 28 }}>{d}d {h}h {m}m {s}s</b>;
}
