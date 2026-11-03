import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
const b = z.object({ bookingId: z.string(), reason: z.string().min(3).max(300) });
// Records the refund and invalidates the booking. The M-Pesa payout itself is made from your Daraja/Paybill portal until a reversal integration is added.
export async function POST(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const bk = await db.booking.findUnique({ where: { id: p.data.bookingId }, include: { payments: true } });
  const pay = bk?.payments.find(x => x.status === "SUCCESS");
  if (!bk || !pay || bk.status === "REFUNDED") return NextResponse.json({ error: "No refundable payment" }, { status: 409 });
  await db.$transaction([
    db.refund.create({ data: { bookingId: bk.id, amountKes: pay.amountKes, reason: p.data.reason, actor: u.id } }),
    db.payment.update({ where: { id: pay.id }, data: { status: "REFUNDED" } }),
    db.booking.update({ where: { id: bk.id }, data: { status: "REFUNDED" } }),
    db.tripSeat.updateMany({ where: { bookingId: bk.id }, data: { status: "AVAILABLE", bookingId: null, heldBy: null, heldUntil: null } }),
    db.auditLog.create({ data: { actor: u.id, action: "booking.refund", detail: { bookingId: bk.id, amountKes: pay.amountKes } } }),
  ]);
  return NextResponse.json({ ok: true, amountKes: pay.amountKes, note: "Send the payout manually, then reconcile" });
}
