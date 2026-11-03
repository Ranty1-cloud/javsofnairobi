export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waSend } from "@/lib/whatsapp";
// Every few minutes with Authorization: Bearer $CRON_SECRET. Notifies waitlisted phone numbers, one per free seat, first come first served.
export async function GET(req: Request) {
  const tpl = process.env.WHATSAPP_WAITLIST_TEMPLATE, app = process.env.APP_URL;
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!tpl || !app) return NextResponse.json({ skipped: "template or APP_URL not set" });
  const pending = await db.waitlist.findMany({ where: { notifiedAt: null }, orderBy: { createdAt: "asc" } });
  const free: Record<string, number> = {}; let sent = 0;
  for (const w of pending) {
    const phone = w.contact.replace(/[\s-]/g, "").replace(/^\+/, "").replace(/^0/, "254");
    if (!/^254[17]\d{8}$/.test(phone)) continue; // emails wait for the email channel
    const trip = await db.trip.findUnique({ where: { id: w.tripId } });
    if (!trip || trip.departsAt < new Date()) continue;
    free[w.tripId] ??= await db.tripSeat.count({ where: { tripId: w.tripId, status: "AVAILABLE" } });
    if (free[w.tripId] <= 0) continue;
    if (await waSend(phone, tpl, [trip.title, `${app}/trips/${trip.slug}`])) { await db.waitlist.update({ where: { id: w.id }, data: { notifiedAt: new Date() } }); free[w.tripId]--; sent++; }
  }
  return NextResponse.json({ sent });
}
