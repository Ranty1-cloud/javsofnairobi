import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { SHOP_ROLES } from "@/lib/shop-constants";
import ShopOrdersList from "@/components/ShopOrdersList";
export const metadata = { title: "Shop orders", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function AdminOrders() {
  if (!(await requireRole(SHOP_ROLES))) redirect("/admin");
  const inc = { items: { select: { id: true, qty: true, productName: true, color: true, size: true } } };
  const [open, done] = await Promise.all([
    db.order.findMany({ where: { status: { in: ["PENDING", "PAID"] } }, orderBy: { createdAt: "asc" }, include: inc }),
    db.order.findMany({ where: { status: { in: ["FULFILLED", "CANCELLED"] } }, orderBy: { createdAt: "desc" }, take: 30, include: inc }),
  ]);
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Operations</p><h1>Shop <span className="red">orders</span></h1><p className="mut" style={{ margin: 0 }}>Match the name, code and exact amount against your M-Pesa statement before confirming.</p></div></header>
      <ShopOrdersList orders={[...open, ...done].map(o => ({ id: o.id, reference: o.reference, status: o.status, mpesaCode: o.mpesaCode, payerName: o.payerName, name: o.name, phone: o.phone, fulfilment: o.fulfilment, address: o.address, totalKes: o.totalKes, createdAt: o.createdAt.toISOString(), items: o.items }))} />
    </main>
  );
}
