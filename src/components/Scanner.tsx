"use client";
import { useEffect, useRef, useState } from "react";
export default function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const busy = useRef(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [manual, setManual] = useState("");
  async function submit(raw: string) {
    if (busy.current) return; busy.current = true;
    const r = await fetch("/api/admin/checkin", { method: "POST", body: JSON.stringify({ token: raw.trim() }) });
    const j = await r.json();
    setResult(j.status === "ok" ? { ok: true, text: `OK: ${j.passenger}, seat ${j.seat}` } : { ok: false, text: j.status === "already_checked_in" ? `Already checked in (seat ${j.seat})` : j.status === "wrong_trip" ? `Wrong trip: ${j.trip}` : r.status === 403 ? "Not authorised" : "Invalid ticket" });
    setTimeout(() => { busy.current = false; }, 2000);
  }
  useEffect(() => {
    const BD = (window as unknown as { BarcodeDetector?: new (o: object) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!BD || !navigator.mediaDevices) return;
    const det = new BD({ formats: ["qr_code"] });
    let stream: MediaStream, timer: ReturnType<typeof setInterval>;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(s => {
      stream = s; if (video.current) { video.current.srcObject = s; video.current.play(); }
      timer = setInterval(async () => { if (video.current && !busy.current) { const c = await det.detect(video.current).catch(() => []); if (c[0]) submit(c[0].rawValue); } }, 500);
    }).catch(() => {});
    return () => { clearInterval(timer); stream?.getTracks().forEach(t => t.stop()); };
  }, []);
  return (
    <div>
      <video ref={video} playsInline muted style={{ width: "100%", maxWidth: 420, borderRadius: 14, background: "#111" }} />
      <p style={{ color: "#A1A1A1" }}>Camera scanning needs a browser with QR detection (Chrome on Android). Otherwise paste the ticket code:</p>
      <input value={manual} onChange={e => setManual(e.target.value)} placeholder="Ticket code" style={{ padding: 12, borderRadius: 8 }} />
      <button onClick={() => submit(manual)} style={{ marginLeft: 8, padding: "12px 20px", background: "#E50914", color: "#fff", border: 0, borderRadius: 8 }}>Check in</button>
      {result && <h2 role="status" style={{ color: result.ok ? "#fff" : "#E50914" }}>{result.text}</h2>}
    </div>
  );
}
