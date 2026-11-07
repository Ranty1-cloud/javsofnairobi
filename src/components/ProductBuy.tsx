"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { addToBag } from "@/lib/bag";
import { COLOR_HEX, COLORS, MAX_QTY } from "@/lib/shop-constants";

type V = { id: string; color: string; size: string; stock: number };
export default function ProductBuy({ product, variants }: { product: { slug: string; name: string; priceKes: number; imageUrl: string | null }; variants: V[] }) {
  const colors = useMemo(() => [...new Set(variants.map(v => v.color))].sort((a, b) => COLORS.indexOf(a as never) - COLORS.indexOf(b as never)), [variants]);
  const sizeOrder = useMemo(() => [...new Set(variants.map(v => v.size))], [variants]);
  const inStock = (c: string) => variants.some(v => v.color === c && v.stock > 0);
  const [color, setColor] = useState(colors.find(inStock) ?? colors[0] ?? "");
  const forColor = variants.filter(v => v.color === color);
  const [size, setSize] = useState(() => (variants.find(v => v.color === (colors.find(inStock) ?? colors[0]) && v.stock > 0) ?? variants[0])?.size ?? "");
  const [qty, setQty] = useState(1), [added, setAdded] = useState(false);
  const chosen = forColor.find(v => v.size === size), max = Math.min(chosen?.stock ?? 0, MAX_QTY);
  // Switching colour keeps the same size when that size is in stock, otherwise picks the first size that is.
  const pickColor = (c: string) => {
    setColor(c); setAdded(false); setQty(1);
    setSize((variants.find(v => v.color === c && v.size === size && v.stock > 0) ?? variants.find(v => v.color === c && v.stock > 0) ?? variants.find(v => v.color === c))?.size ?? "");
  };
  if (!variants.length || !variants.some(v => v.stock > 0)) return <p className="badge amber" style={{ marginTop: 16 }}>Sold out for now</p>;
  const one = sizeOrder.length === 1 && sizeOrder[0] === "One size";
  return (
    <div style={{ marginTop: 18 }}>
      <b>Colour: <span className="mut" style={{ fontWeight: 400 }}>{color}</span></b>
      <div className="opts" role="radiogroup" aria-label="Colour">{colors.map(c => <button key={c} type="button" role="radio" aria-checked={c === color} aria-label={`${c}${inStock(c) ? "" : " (sold out)"}`} title={c} disabled={!inStock(c)} className={`swatch${c === color ? " on" : ""}`} style={{ background: COLOR_HEX[c] ?? "#888" }} onClick={() => pickColor(c)} />)}</div>
      {!one && <><b>Size</b><div className="opts" role="radiogroup" aria-label="Size">{sizeOrder.map(s => { const v = forColor.find(x => x.size === s); return <button key={s} type="button" role="radio" aria-checked={s === size} disabled={!v || v.stock < 1} className={`sizeb${s === size ? " on" : ""}`} onClick={() => { setSize(s); setQty(1); setAdded(false); }}>{s}</button>; })}</div></>}
      {chosen && chosen.stock > 0 && chosen.stock <= 5 && <p className="badge amber" style={{ marginBottom: 12 }}>Only {chosen.stock} left</p>}
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div className="qty" aria-label="Quantity"><button type="button" aria-label="Fewer" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button><b aria-live="polite">{qty}</b><button type="button" aria-label="More" onClick={() => setQty(q => Math.min(max, q + 1))}>+</button></div>
        <button className="btn" disabled={!chosen || max < 1} onClick={() => { addToBag({ variantId: chosen!.id, slug: product.slug, name: product.name, color, size, unitKes: product.priceKes, qty, imageUrl: product.imageUrl, max: chosen!.stock }); setAdded(true); }}>Add to bag</button>
      </div>
      {added && <p role="status" style={{ color: "#6ee39a" }}>Added to your bag. <Link className="red" href="/shop/cart">View bag &amp; check out</Link> or keep shopping.</p>}
    </div>
  );
}
