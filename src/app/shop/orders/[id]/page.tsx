import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { TILL } from "@/lib/pay";
import { ksh, fmtDateTime } from "@/lib/format";
import OrderPay from "@/components/OrderPay";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your order", robots: { index: false } };
const NOTE: Record<string, string> = { PAID: "Payment confirmed. We'll contact you on the number you gave to arrange it.", FULFILLED: "This order has been handed over. Thank you!", CANCELLED: "This order was cancelled and the items went back on sale." };
export default async function Order({ params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(`/shop/orders/${params.id}`)}`);
  const o = await db.order.findFirst({ where: { id: params.id, userId: s.userId }, include: { items: true } });
  if (!o) notFound();
  return (
    <>
      <p className="mut"><Link href="/shop/orders">← My orders</Link></p>
      <h1>Order <span className="red">{o.reference}</span></h1>
      <p><span className={`badge ${o.status === "PENDING" ? "amber" : o.status === "CANCELLED" ? "" : "red"}`}>{o.status === "PENDING" ? (o.mpesaCode ? "Awaiting confirmation" : "Awaiting payment") : o.status}</span> <span className="mut">Placed {fmtDateTime(o.createdAt)}</span></p>
      {NOTE[o.status] && <p>{NOTE[o.status]}</p>}
      <div className="two">
        <section className="card">
          {o.items.map(i => <p key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, margin: "6px 0" }}><span>{i.qty} × {i.productName} <span className="mut">({i.color}{i.size !== "One size" && `, ${i.size}`})</span></span><span>{ksh(i.unitKes * i.qty)}</span></p>)}
          <hr style={{ border: 0, borderTop: "1px solid var(--line)" }} />
          {o.deliveryKes > 0 && <p style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}><span className="mut">Delivery</span><span>{ksh(o.deliveryKes)}</span></p>}
          <p style={{ display: "flex", justifyContent: "space-between", margin: "6px 0", fontSize: "1.15rem" }}><b>Total</b><b>{ksh(o.totalKes)}</b></p>
          <p className="mut" style={{ fontSize: ".85rem" }}>{o.fulfilment === "DELIVERY" ? `Delivery to: ${o.address}` : "Pickup in Nairobi"} · {o.name} · {o.phone}</p>
        </section>
        {o.status === "PENDING" && <OrderPay id={o.id} till={TILL} reference={o.reference} amount={o.totalKes} code={o.mpesaCode} payerName={o.payerName} />}
      </div>
    </>
  );
}
