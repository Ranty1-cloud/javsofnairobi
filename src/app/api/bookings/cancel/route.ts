import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const { id } = await req.json();
  const b = await db.booking.findUnique({ where: { id }, include: { payments: true } });
  if (!b || b.userId !== s.userId) return NextResponse.json({ error: "Not found" }, { status: 404 }); // ownership check
  if (b.status !== "PENDING") return NextResponse.json({ error: "Paid bookings are cancelled through support so the refund is handled properly" }, { status: 409 });
  if (Date.now() - b.createdAt.getTime() < 5 * 60_000 && b.payments.some(p => p.status === "PENDING")) return NextResponse.json({ error: "A payment prompt is still active. Wait a few minutes, then cancel." }, { status: 409 });
  await db.$transaction([
    db.tripSeat.updateMany({ where: { bookingId: id, status: "RESERVED" }, data: { status: "AVAILABLE", heldBy: null, heldUntil: null, bookingId: null } }),
    db.booking.update({ where: { id }, data: { status: "CANCELLED" } }),
    db.auditLog.create({ data: { actor: s.userId, action: "booking.cancel", detail: { id } } }),
  ]);
  return NextResponse.json({ ok: true });
}
