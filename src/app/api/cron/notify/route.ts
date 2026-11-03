import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyBooking } from "@/lib/whatsapp";
// Retry failed WhatsApp sends (max 3 attempts). Call every few minutes with Authorization: Bearer $CRON_SECRET.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const failed = await db.notification.findMany({ where: { channel: "whatsapp", status: "FAILED", attempts: { lt: 3 } }, take: 20 });
  const out: string[] = [];
  for (const n of failed) out.push(await notifyBooking(n.bookingId));
  return NextResponse.json({ retried: out.length, results: out });
}
