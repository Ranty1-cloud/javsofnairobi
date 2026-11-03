"use client";
import { useEffect, useState } from "react";
type Item = { id: string; url: string; caption: string; category: string };
export default function GalleryGrid({ items }: { items: Item[] }) {
  const [i, setI] = useState<number | null>(null);
  useEffect(() => {
    if (i === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setI(null); if (e.key === "ArrowRight") setI(x => (x === null ? x : (x + 1) % items.length)); if (e.key === "ArrowLeft") setI(x => (x === null ? x : (x - 1 + items.length) % items.length)); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [i, items.length]);
  const cur = i === null ? null : items[i];
  return (
    <>
      <div className="masonry">{items.map((m, n) => <button key={m.id} onClick={() => setI(n)} aria-label={`Open photo: ${m.caption || m.category}`}><img src={m.url} alt={m.caption || m.category} loading="lazy" /></button>)}</div>
      {cur && <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setI(null)}>
        <button className="btn ghost sm x" onClick={() => setI(null)} aria-label="Close">Close ✕</button>
        <div onClick={e => e.stopPropagation()}><img src={cur.url} alt={cur.caption || cur.category} /><p>{cur.caption} <span className="red">· {cur.category}</span> · {i! + 1}/{items.length}</p></div>
      </div>}
    </>
  );
}
