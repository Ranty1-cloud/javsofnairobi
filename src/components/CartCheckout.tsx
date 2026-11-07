"use client";
import Link from "next/link";
import { useState } from "react";
import { useBag, writeBag } from "@/lib/bag";
import { MAX_QTY } from "@/lib/shop-constants";
import { ksh } from "@/lib/format";

export default function CartCheckout({ signedIn, defaultName, defaultPhone, deliveryFee }: { signedIn: boolean; defaultName: string; defaultPhone: string; deliveryFee: number | null }) {
  const [bag, ready] = useBag();
  const [fulfilment, setFulfilment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [name, setName] = useState(defaultName), [phone, setPhone] = useState(defaultPhone), [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const sub = bag.reduce((s, i) => s + i.unitKes * i.qty, 0), fee = fulfilment === "DELIVERY" ? deliveryFee ?? 0 : 0;
  const setQty = (id: string, q: number) => writeBag(bag.map(i => (i.variantId === id ? { ...i, qty: Math.max(1, Math.min(i.max, MAX_QTY, q)) } : i)));
  const remove = (id: string) => writeBag(bag.filter(i => i.variantId !== id));
  const next = encodeURIComponent("/shop/cart");

  async function place(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/shop/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: bag.map(i => ({ variantId: i.variantId, qty: i.qty })), name, phone, fulfilment, address: fulfilment === "DELIVERY" ? address : undefined }) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { window.location.href = `/login?next=${next}`; return; }
    setBusy(false);
    if (!r.ok) return setErr(j.error ?? "Could not place the order.");
    writeBag([]); window.location.href = `/shop/orders/${j.id}`;
  }

  if (!ready) return <p className="mut">Loading your bag…</p>;
  if (!bag.length) return <div className="empty">Your bag is empty. <Link className="red" href="/shop">Browse the merch</Link></div>;
  return (
    <div className="two">
      <section>
        {bag.map(i => (
          <div key={i.variantId} className="bagrow">
            {i.imageUrl ? <img src={i.imageUrl} alt="" /> : <div className="ph" />}
            <div><Link href={`/shop/${i.slug}`}><b>{i.name}</b></Link><br /><span className="mut" style={{ fontSize: ".85rem" }}>{i.color}{i.size !== "One size" && ` · ${i.size}`} · {ksh(i.unitKes)} each</span>
              <div className="qty" style={{ marginTop: 6 }}><button type="button" aria-label="Fewer" onClick={() => setQty(i.variantId, i.qty - 1)}>−</button><b>{i.qty}</b><button type="button" aria-label="More" onClick={() => setQty(i.variantId, i.qty + 1)}>+</button><button type="button" className="mut" style={{ background: "none", border: 0, width: "auto", cursor: "pointer", fontSize: ".85rem", textDecoration: "underline" }} onClick={() => remove(i.variantId)}>Remove</button></div></div>
            <b>{ksh(i.unitKes * i.qty)}</b>
          </div>
        ))}
      </section>
      <section className="card">
        <h3>Checkout</h3>
        {!signedIn ? (
          <>
            <p className="mut">Log in or create a free account to place your order. Your bag will be waiting for you.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link className="btn" href={`/login?next=${next}`}>Log in</Link><Link className="btn ghost" href={`/register?next=${next}`}>Create account</Link></div>
          </>
        ) : (
          <form onSubmit={place}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required minLength={2} maxLength={80} autoComplete="name" aria-label="Your name" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone, e.g. 0712 345 678" required type="tel" autoComplete="tel" aria-label="Phone number" />
            <fieldset style={{ border: 0, padding: 0, margin: "10px 0" }}>
              <legend className="mut" style={{ fontSize: ".85rem" }}>How will you get it?</legend>
              <label style={{ display: "block" }}><input type="radio" checked={fulfilment === "PICKUP"} onChange={() => setFulfilment("PICKUP")} /> Pickup in Nairobi (free). We'll call or WhatsApp you to arrange it.</label>
              {deliveryFee !== null && <label style={{ display: "block" }}><input type="radio" checked={fulfilment === "DELIVERY"} onChange={() => setFulfilment("DELIVERY")} /> Delivery ({ksh(deliveryFee)})</label>}
            </fieldset>
            {fulfilment === "DELIVERY" && <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Delivery address and landmark" required minLength={5} maxLength={300} rows={3} aria-label="Delivery address" />}
            <p style={{ display: "flex", justifyContent: "space-between", margin: "12px 0 4px" }}><span className="mut">Items</span><span>{ksh(sub)}</span></p>
            {fee > 0 && <p style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}><span className="mut">Delivery</span><span>{ksh(fee)}</span></p>}
            <p style={{ display: "flex", justifyContent: "space-between", margin: "4px 0 12px", fontSize: "1.15rem" }}><b>Total</b><b>{ksh(sub + fee)}</b></p>
            <button className="btn" disabled={busy}>{busy ? "Placing order…" : "Place order"}</button>
            <p className="mut" style={{ fontSize: ".8rem" }}>Next you'll pay with M-Pesa. Prices and stock are confirmed when you place the order.</p>
            {err && <p role="alert" style={{ color: "#E50914" }}>{err}</p>}
          </form>
        )}
      </section>
    </div>
  );
}
