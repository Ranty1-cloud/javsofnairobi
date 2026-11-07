import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { confirmPayment } from "@/lib/confirm";
const b = z.object({ paymentId: z.string(), action: z.enum(["confirm", "reject"]) });
export async function POST(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER", "BOOKING_MANAGER"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const pay = await db.payment.findUnique({ where: { id: p.data.paymentId } });
  if (!pay || pay.provider !== "mpesa_manual" || pay.status !== "PENDING") return NextResponse.json({ error: "Not a pending manual payment" }, { status: 409 });
  await db.auditLog.create({ data: { actor: u.id, action: `manual.${p.data.action}`, detail: { paymentId: pay.id, code: pay.providerRef, payerName: pay.payerName } } });
  if (p.data.action === "reject") { await db.payment.update({ where: { id: pay.id }, data: { status: "FAILED" } }); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ result: await confirmPayment(pay.id) });
}
