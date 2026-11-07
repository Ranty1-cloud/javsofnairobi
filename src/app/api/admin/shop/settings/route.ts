import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { DELIVERY_FEE_KEY, SHOP_ROLES } from "@/lib/shop-constants";

// Delivery fee in KSh. Empty (null) switches delivery off so customers can only choose pickup.
export async function PATCH(req: Request) {
  const u = await requireRole(SHOP_ROLES);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ deliveryFeeKes: z.number().int().min(0).max(100_000).nullable() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter a whole number of shillings, or leave it empty for pickup only." }, { status: 400 });
  if (p.data.deliveryFeeKes === null) await db.siteSetting.deleteMany({ where: { key: DELIVERY_FEE_KEY } });
  else await db.siteSetting.upsert({ where: { key: DELIVERY_FEE_KEY }, update: { value: String(p.data.deliveryFeeKes) }, create: { key: DELIVERY_FEE_KEY, value: String(p.data.deliveryFeeKes) } });
  await db.auditLog.create({ data: { actor: u.id, action: "shop.delivery.update", detail: { deliveryFeeKes: p.data.deliveryFeeKes } } });
  return NextResponse.json({ ok: true });
}
