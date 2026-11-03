import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { limited } from "@/lib/ratelimit";
const b = z.object({ token: z.string().min(10), rating: z.number().int().min(1).max(5), body: z.string().min(3).max(1000) });
export async function POST(req: Request) {
  if (limited("r:" + (req.headers.get("x-forwarded-for") ?? "ip"), 5)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const t = await db.ticket.findUnique({ where: { token: p.data.token }, include: { booking: true } });
  if (!t || !t.checkedInAt || t.booking.status !== "CONFIRMED") return NextResponse.json({ error: "Reviews open after you have travelled" }, { status: 403 }); // verified travellers only
  try { await db.review.create({ data: { tripId: t.booking.tripId, ticketId: t.id, name: t.passengerName.split(" ")[0], rating: p.data.rating, body: p.data.body } }); }
  catch { return NextResponse.json({ error: "You already reviewed this trip" }, { status: 409 }); }
  return NextResponse.json({ ok: true });
}
