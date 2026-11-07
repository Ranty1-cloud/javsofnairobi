"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string; handoff?: boolean };
const wa = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
const START: Msg = { role: "assistant", content: "Hi! I can help with booking, tickets and how things work. I can not see your booking or payment, so for those I will point you to our team." };

export default function FloatingHelp() {
  const path = usePathname() ?? "";
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([START]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, open]);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open]);
  if (path.startsWith("/admin")) return null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    const next = [...msgs, { role: "user" as const, content: t }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await fetch("/api/support/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next.slice(1).slice(-8).map(({ role, content }) => ({ role, content })) }) });
      const j = await r.json().catch(() => ({}));
      setMsgs(m => [...m, { role: "assistant", content: j.reply ?? "Something went wrong. Please try again.", handoff: !!j.handoff }]);
    } catch { setMsgs(m => [...m, { role: "assistant", content: "I could not connect. Please check your internet and try again.", handoff: !!wa }]); }
    setBusy(false);
  }

  return (
    <div className="help-float">
      {open && (
        <section className="chat" role="dialog" aria-label="Support chat">
          <header><b>JAVS support</b><button onClick={() => setOpen(false)} aria-label="Close chat">✕</button></header>
          <div className="chat-body" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`bub ${m.role}`}>{m.content}
                {m.handoff && wa && <a className="btn sm" href={`https://wa.me/${wa}?text=${encodeURIComponent("Hi JAVS, I need help with: " + (msgs[i - 1]?.content ?? "").slice(0, 200))}`} target="_blank" rel="noreferrer">Continue on WhatsApp</a>}
              </div>
            ))}
            {busy && <div className="bub assistant mut">Typing…</div>}
            <div ref={end} />
          </div>
          <form onSubmit={send}><input value={text} onChange={e => setText(e.target.value)} placeholder="Ask a question" maxLength={600} aria-label="Your message" autoComplete="off" /><button className="btn sm" disabled={busy || !text.trim()}>Send</button></form>
          <small className="mut">Automated answers. Never share your M-Pesa PIN or card details.</small>
        </section>
      )}
      <div className="help-btns">
        <button className="help-chat" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={open ? "Close support chat" : "Open support chat"}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" /></svg>
        </button>
        {wa && <a className="help-wa" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
          <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.55 4.18 1.6 6L4 29l8.17-1.57a12.03 12.03 0 003.87.64C22.67 28.07 28 22.67 28 16.04 28 9.4 22.67 3 16.04 3zm0 22.04c-1.22 0-2.4-.33-3.44-.95l-.25-.15-4.85.93.95-4.72-.17-.27a9.9 9.9 0 01-1.52-5.3c0-5.5 4.47-9.97 9.98-9.97 5.5 0 9.97 4.47 9.97 9.98 0 5.5-4.47 9.95-9.97 9.95zm5.47-7.46c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z" /></svg>
        </a>}
      </div>
    </div>
  );
}
