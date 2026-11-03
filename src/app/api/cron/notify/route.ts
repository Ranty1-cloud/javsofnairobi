import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyBooking } from "@/lib/whatsapp";
import { notifyEmail } from "@/lib/notify-email";
// Retry failed WhatsApp and email sends (max 3 attempts each). Call every few minutes with Authorization: Bearer $CRON_SECRET.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const failed = await db.notification.findMany({ where: { channel: { in: ["whatsapp", "email"] }, status: "FAILED", attempts: { lt: 3 } }, take: 40 });
  const out: string[] = [];
  for (const n of failed) out.push(`${n.channel}:${n.channel === "email" ? await notifyEmail(n.bookingId) : await notifyBooking(n.bookingId)}`);
  return NextResponse.json({ retried: out.length, results: out });
}
