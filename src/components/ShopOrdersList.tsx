"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, errText } from "@/lib/admin-fetch";
import { ksh } from "@/lib/format";

export type ORow = { id: string; reference: string; status: string; mpesaCode: string | null; payerName: string | null; name: string; phone: string; fulfilment: string; address: string | null; totalKes: number; createdAt: string; items: { id: string; qty: number; productName: string; color: string; size: string }[] };

function Card({ o, children }: { o: ORow; children?: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <h4>{o.reference}: {ksh(o.totalKes)}</h4>
      {o.status === "PENDING" && o.mpesaCode && <>
        <p style={{ margin: "6px 0" }}>Name on M-Pesa: {o.payerName ? <b style={{ fontSize: "1.1rem", letterSpacing: ".04em" }}>{o.payerName.toUpperCase()}</b> : <span className="mut">none given</span>}</p>
        <p style={{ margin: "6px 0" }}>Code submitted: <b>{o.mpesaCode}</b></p>
      </>}
      <p className="mut" style={{ margin: "6px 0" }}>{o.items.map(i => `${i.qty} × ${i.productName} (${i.color}${i.size !== "One size" ? `, ${i.size}` : ""})`).join(" · ")}</p>
      <p className="mut" style={{ margin: "6px 0", fontSize: ".85rem" }}>{o.name} · {o.phone} · {o.fulfilment === "DELIVERY" ? `Deliver to: ${o.address}` : "Pickup"} · {new Date(o.createdAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</p>
      {children}
    </div>
  );
}

export default function ShopOrdersList({ orders }: { orders: ORow[] }) {
  const router = useRouter(), [err, setErr] = useState("");
  async function act(o: ORow, action: "confirm" | "reject" | "fulfil" | "cancel", ask?: string) {
    if (ask && !confirm(ask)) return;
    setErr("");
    const { ok, j } = await api(`/api/admin/orders/${o.id}`, "POST", { action });
    if (!ok) setErr(errText(j, "Failed"));
    router.refresh();
  }
  const checking = orders.filter(o => o.status === "PENDING" && o.mpesaCode), unpaid = orders.filter(o => o.status === "PENDING" && !o.mpesaCode), toHand = orders.filter(o => o.status === "PAID"), done = orders.filter(o => o.status === "FULFILLED" || o.status === "CANCELLED");
  const group = (title: string, hint: string, list: ORow[], body: (o: ORow) => React.ReactNode) => (
    <section className="panel"><div className="panel-head"><h2>{title}</h2><span className="mut">{list.length}</span></div>{list.length ? list.map(o => <Card key={o.id} o={o}>{body(o)}</Card>) : <p className="mut" style={{ margin: 0 }}>{hint}</p>}</section>
  );
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {err && <p role="alert" style={{ color: "#ff6b73", margin: 0 }}>{err}</p>}
      {group("Awaiting confirmation", "No payment codes waiting.", checking, o => <><button className="btn" onClick={() => act(o, "confirm", "Confirm you have seen this exact name, amount and code in your M-Pesa statement?")}>Confirm paid</button> <button className="btn" style={{ background: "#171717" }} onClick={() => act(o, "reject", "Reject this payment and put the items back on sale?")}>Reject</button></>)}
      {group("Paid: to hand over", "Nothing waiting to be handed over.", toHand, o => <><button className="btn" onClick={() => act(o, "fulfil")}>Mark handed over</button> <button className="btn ghost" onClick={() => act(o, "cancel", "Cancel this paid order and put the items back on sale? Any refund must be sent to the customer yourself.")}>Cancel &amp; restock</button></>)}
      {group("Unpaid", "No unpaid orders. These give their stock back automatically after 24 hours.", unpaid, o => <button className="btn ghost" onClick={() => act(o, "reject", "Cancel this unpaid order and put the items back on sale?")}>Cancel &amp; restock</button>)}
      {group("Recently finished", "Nothing yet.", done, o => <span className="mut">{o.status === "FULFILLED" ? "Handed over" : "Cancelled"}</span>)}
    </div>
  );
}
