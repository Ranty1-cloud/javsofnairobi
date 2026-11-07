import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { cancelOrder } from "@/lib/shop";
import { SHOP_ROLES } from "@/lib/shop-constants";

// confirm: PENDING with a code -> PAID | reject: PENDING -> CANCELLED (stock returns) | fulfil: PAID -> FULFILLED | cancel: PAID -> CANCELLED (stock returns; refund is handled by staff)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const u = await requireRole(SHOP_ROLES);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ action: z.enum(["confirm", "reject", "fulfil", "cancel"]) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const o = await db.order.findUnique({ where: { id: params.id } });
  if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  let ok = false;
  if (p.data.action === "confirm") ok = (await db.order.updateMany({ where: { id: o.id, status: "PENDING", mpesaCode: { not: null } }, data: { status: "PAID", paidAt: new Date() } })).count === 1;
  else if (p.data.action === "fulfil") ok = (await db.order.updateMany({ where: { id: o.id, status: "PAID" }, data: { status: "FULFILLED" } })).count === 1;
  else ok = await cancelOrder(o.id, p.data.action === "reject" ? ["PENDING"] : ["PAID"]);
  if (!ok) return NextResponse.json({ error: "That order has already changed. Refresh the page." }, { status: 409 });
  await db.auditLog.create({ data: { actor: u.id, action: `shop.order.${p.data.action}`, detail: { orderId: o.id, reference: o.reference, code: o.mpesaCode, payerName: o.payerName, totalKes: o.totalKes } } });
  return NextResponse.json({ ok: true });
}
