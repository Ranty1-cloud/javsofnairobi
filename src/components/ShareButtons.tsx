"use client";
import { useState } from "react";
// WhatsApp first: that is where Nganya and trip groups share plans.
export default function ShareButtons({ title, line }: { title: string; line: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => window.location.origin + window.location.pathname;
  const text = () => `${title}\n${line}\n${url()}`;
  async function copy() {
    try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("Copy this link", url()); }
  }
  async function native() {
    try { await navigator.share({ title, text: line, url: url() }); } catch { /* cancelled */ }
  }
  const canNative = typeof navigator !== "undefined" && typeof navigator.share === "function";
  return (
    <div className="share" role="group" aria-label="Share this trip">
      <span className="mut">Share with friends</span>
      <a className="btn sm" href="#" onClick={e => { e.preventDefault(); window.open(`https://wa.me/?text=${encodeURIComponent(text())}`, "_blank", "noopener"); }}>WhatsApp</a>
      <a className="btn ghost sm" href="#" onClick={e => { e.preventDefault(); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`, "_blank", "noopener"); }}>Facebook</a>
      <a className="btn ghost sm" href="#" onClick={e => { e.preventDefault(); window.open(`https://x.com/intent/post?text=${encodeURIComponent(`${title} - ${line}`)}&url=${encodeURIComponent(url())}`, "_blank", "noopener"); }}>X</a>
      <button type="button" className="btn ghost sm" onClick={copy}>{copied ? "Link copied" : "Copy link"}</button>
      {canNative && <button type="button" className="btn ghost sm" onClick={native}>More…</button>}
    </div>
  );
}
