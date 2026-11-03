export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waSend } from "@/lib/whatsapp";
// Run hourly with Authorization: Bearer $CRON_SECRET. Sends one reminder per booking for trips departing within 24h.
export async function GET(req: Request) {
  const tpl = process.env.WHATSAPP_REMINDER_TEMPLATE;
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!tpl) return NextResponse.json({ skipped: "WHATSAPP_REMINDER_TEMPLATE not set" });
  const now = new Date();
  const list = await db.booking.findMany({ where: { status: "CONFIRMED", whatsappOptIn: true, phone: { not: null }, trip: { departsAt: { gt: now, lt: new Date(now.getTime() + 864e5) } }, notifications: { none: { channel: "whatsapp_reminder" } } }, include: { trip: true, passengers: true }, take: 50 });
  let sent = 0;
  for (const b of list) {
    let id: string;
    try { id = (await db.notification.create({ data: { bookingId: b.id, channel: "whatsapp_reminder", status: "PENDING" } })).id; } catch { continue; }
    const when = b.trip.departsAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });
    const ref = await waSend(b.phone!, tpl, [b.passengers[0]?.name ?? "there", b.trip.title, when, b.trip.meetingPoint]);
    await db.notification.update({ where: { id }, data: { status: ref ? "SENT" : "FAILED", providerRef: ref, attempts: 1 } });
    if (ref) sent++;
  }
  return NextResponse.json({ due: list.length, sent });
}
