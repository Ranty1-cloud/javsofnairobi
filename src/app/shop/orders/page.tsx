import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ksh, fmtDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "My orders", robots: { index: false } };
export default async function Orders() {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent("/shop/orders")}`);
  const orders = await db.order.findMany({ where: { userId: s.userId }, orderBy: { createdAt: "desc" }, include: { items: true } });
  return (
    <>
      <h1>My <span className="red">orders</span></h1>
      <div className="grid">
        {orders.map(o => (
          <Link key={o.id} href={`/shop/orders/${o.id}`} className="card">
            <small className="mut">{o.status === "PENDING" ? (o.mpesaCode ? "Awaiting confirmation" : "Awaiting payment") : o.status} · {fmtDate(o.createdAt)}</small>
            <h3>{o.reference}</h3>
            <p className="mut" style={{ margin: 0 }}>{o.items.map(i => `${i.qty} × ${i.productName}`).join(", ")}</p>
            <p style={{ margin: "8px 0 0" }}><b>{ksh(o.totalKes)}</b></p>
          </Link>
        ))}
        {!orders.length && <div className="empty">No orders yet. <Link className="red" href="/shop">Browse the merch</Link></div>}
      </div>
    </>
  );
}
