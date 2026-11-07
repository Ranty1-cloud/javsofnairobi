import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { SHOP_ROLES } from "@/lib/shop-constants";
import { productBody, uniqueSlug, variantsFrom } from "@/lib/shop-admin";

export async function POST(req: Request) {
  const u = await requireRole(SHOP_ROLES);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = productBody.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Check the fields and try again." }, { status: 400 });
  const { stock, ...data } = p.data, variants = variantsFrom(data.kind, stock);
  if (!variants) return NextResponse.json({ error: "A colour or size in the stock grid isn't valid for this product type." }, { status: 400 });
  const row = await db.product.create({ data: { ...data, slug: await uniqueSlug(`${data.brand === "KIBURI_NATION" ? "kiburi" : "javs"}-${data.name}`), variants: { create: variants } } });
  await db.auditLog.create({ data: { actor: u.id, action: "shop.product.create", detail: { id: row.id, name: row.name } } });
  return NextResponse.json({ id: row.id }, { status: 201 });
}
