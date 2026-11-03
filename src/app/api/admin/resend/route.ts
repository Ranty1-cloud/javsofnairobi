import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { notifyBooking } from "@/lib/whatsapp";
export async function POST(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { bookingId } = await req.json();
  const result = await notifyBooking(String(bookingId), true);
  await db.auditLog.create({ data: { actor: u.id, action: "ticket.resend", detail: { bookingId, result } } });
  return NextResponse.json({ result });
}
