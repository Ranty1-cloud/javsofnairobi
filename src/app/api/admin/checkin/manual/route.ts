import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
// Check a passenger in from the boarding list (no phone or QR). Same atomic guard as the scanner: only one write can flip checkedInAt.
export async function POST(req: Request) {
  const staff = await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT"]);
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ ticketId: z.string().min(5).max(40), undo: z.boolean().optional() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const t = await db.ticket.findUnique({ where: { id: p.data.ticketId }, select: { id: true, booking: { select: { status: true } } } });
  if (!t || t.booking.status !== "CONFIRMED") return NextResponse.json({ error: "Not a valid ticket" }, { status: 404 });
  // Two separate calls: Prisma's types reject one call that takes either of two differently shaped argument objects.
  const r = p.data.undo
    ? await db.ticket.updateMany({ where: { id: t.id, checkedInAt: { not: null } }, data: { checkedInAt: null, checkedInBy: null } })
    : await db.ticket.updateMany({ where: { id: t.id, checkedInAt: null }, data: { checkedInAt: new Date(), checkedInBy: staff.id } });
  if (!r.count) return NextResponse.json({ error: p.data.undo ? "Not checked in" : "Already checked in" }, { status: 409 });
  await db.auditLog.create({ data: { actor: staff.id, action: p.data.undo ? "ticket.checkin_undo" : "ticket.checkin", detail: { ticketId: t.id, manual: true } } });
  return NextResponse.json({ ok: true });
}
