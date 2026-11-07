import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { SHOP_ROLES } from "@/lib/shop-constants";
import { productBody, variantsFrom } from "@/lib/shop-admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const u = await requireRole(SHOP_ROLES);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = productBody.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Check the fields and try again." }, { status: 400 });
  const { stock, ...data } = p.data, variants = variantsFrom(data.kind, stock);
  if (!variants) return NextResponse.json({ error: "A colour or size in the stock grid isn't valid for this product type." }, { status: 400 });
  if (!(await db.product.findUnique({ where: { id: params.id }, select: { id: true } }))) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  await db.$transaction(async tx => {
    await tx.product.update({ where: { id: params.id }, data }); // the web address (slug) stays the same so shared links keep working
    for (const v of variants) await tx.productVariant.upsert({ where: { productId_color_size: { productId: params.id, color: v.color, size: v.size } }, update: { stock: v.stock }, create: { productId: params.id, ...v } });
    await tx.productVariant.deleteMany({ where: { productId: params.id, ...(variants.length ? { NOT: { OR: variants.map(v => ({ color: v.color, size: v.size })) } } : {}) } });
  });
  await db.auditLog.create({ data: { actor: u.id, action: "shop.product.update", detail: { id: params.id } } });
  return NextResponse.json({ ok: true });
}

// Past orders keep their own copy of the name, colour, size and price, so deleting a product never damages order history.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const u = await requireRole(SHOP_ROLES);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const r = await db.product.deleteMany({ where: { id: params.id } });
  if (!r.count) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  await db.auditLog.create({ data: { actor: u.id, action: "shop.product.delete", detail: { id: params.id } } });
  return NextResponse.json({ ok: true });
}
