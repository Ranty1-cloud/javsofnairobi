"use client";
import { useEffect, useState } from "react";
export default function Countdown({ to }: { to: string }) {
  const [t, setT] = useState<number | null>(null);
  useEffect(() => { const f = () => setT(Math.max(0, new Date(to).getTime() - Date.now())); f(); const i = setInterval(f, 1000); return () => clearInterval(i); }, [to]);
  const v = t ?? 0, p = (n: number) => String(n).padStart(2, "0");
  const parts: [string, string][] = [[String(Math.floor(v / 864e5)), "Days"], [p(Math.floor(v / 36e5) % 24), "Hrs"], [p(Math.floor(v / 6e4) % 60), "Min"], [p(Math.floor(v / 1e3) % 60), "Sec"]];
  return <div className="cd" role="timer" aria-label="Time until departure">{parts.map(([n, l]) => <div key={l}><b>{t === null ? "--" : n}</b><span>{l}</span></div>)}</div>;
}
