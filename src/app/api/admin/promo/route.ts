import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
const b = z.object({ code: z.string().min(3).max(30), percentOff: z.number().int().min(1).max(90), maxUses: z.number().int().min(1), expiresAt: z.coerce.date().optional() });
export async function POST(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const code = p.data.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return NextResponse.json({ error: "Use letters, numbers, - or _ only" }, { status: 400 });
  if (await db.promoCode.findUnique({ where: { code } })) return NextResponse.json({ error: "That code already exists" }, { status: 409 });
  const row = await db.promoCode.create({ data: { ...p.data, code } });
  await db.auditLog.create({ data: { actor: u.id, action: "promo.create", detail: { code: row.code } } });
  return NextResponse.json(row, { status: 201 });
}

// Switch a code on or off. Codes are never deleted so past bookings keep their record.
export async function PATCH(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ id: z.string().min(5).max(40), active: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const r = await db.promoCode.updateMany({ where: { id: p.data.id }, data: { active: p.data.active } });
  if (!r.count) return NextResponse.json({ error: "No such code" }, { status: 404 });
  await db.auditLog.create({ data: { actor: u.id, action: p.data.active ? "promo.enable" : "promo.disable", detail: { id: p.data.id } } });
  return NextResponse.json({ ok: true });
}
