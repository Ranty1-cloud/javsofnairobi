import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
const body = z.object({ token: z.string().min(10).max(100), tripId: z.string().optional() });
export async function POST(req: Request) {
  const staff = await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT"]);
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ status: "invalid" }, { status: 400 });
  const t = await db.ticket.findUnique({ where: { token: p.data.token }, include: { seat: true, booking: { include: { trip: true } } } });
  if (!t || t.booking.status !== "CONFIRMED") return NextResponse.json({ status: "invalid" }, { status: 404 });
  if (p.data.tripId && t.booking.tripId !== p.data.tripId) return NextResponse.json({ status: "wrong_trip", trip: t.booking.trip.title }, { status: 409 });
  // Atomic: only one scan can flip checkedInAt from null, so double scans cannot both succeed.
  const r = await db.ticket.updateMany({ where: { id: t.id, checkedInAt: null }, data: { checkedInAt: new Date(), checkedInBy: staff.id } });
  if (r.count === 0) return NextResponse.json({ status: "already_checked_in", at: t.checkedInAt, seat: t.seat.label }, { status: 409 });
  await db.auditLog.create({ data: { actor: staff.id, action: "ticket.checkin", detail: { ticketId: t.id } } });
  return NextResponse.json({ status: "ok", passenger: t.passengerName, seat: t.seat.label });
}
