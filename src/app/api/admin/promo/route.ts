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
  const row = await db.promoCode.create({ data: { ...p.data, code: p.data.code.toUpperCase() } });
  await db.auditLog.create({ data: { actor: u.id, action: "promo.create", detail: { code: row.code } } });
  return NextResponse.json(row, { status: 201 });
}
