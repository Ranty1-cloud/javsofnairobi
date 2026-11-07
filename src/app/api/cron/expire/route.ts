export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { releasePromo } from "@/lib/promo";
// Call every minute from a scheduler (Vercel Cron, systemd timer, etc) with Authorization: Bearer $CRON_SECRET.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const now = new Date();
  const holds = await db.tripSeat.updateMany({ where: { status: "RESERVED", bookingId: null, heldUntil: { lt: now } }, data: { status: "AVAILABLE", heldBy: null, heldUntil: null } });
  // Manual Till payers get 2 hours before their booking expires.
  const stale = await db.booking.findMany({ where: { status: "PENDING", createdAt: { lt: new Date(now.getTime() - 15 * 60_000) }, payments: { none: { OR: [{ status: "SUCCESS" }, { provider: "mpesa_manual", createdAt: { gt: new Date(now.getTime() - 2 * 3600_000) } }] } } }, select: { id: true, promoCode: true } });
  const ids = stale.map(b => b.id);
  await db.$transaction([
    db.tripSeat.updateMany({ where: { bookingId: { in: ids }, status: "RESERVED" }, data: { status: "AVAILABLE", heldBy: null, heldUntil: null, bookingId: null } }),
    db.booking.updateMany({ where: { id: { in: ids } }, data: { status: "EXPIRED" } }),
  ]);
  for (const b of stale) await releasePromo(b.promoCode);
  return NextResponse.json({ releasedHolds: holds.count, expiredBookings: ids.length });
}
