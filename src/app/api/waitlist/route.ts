import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { limited, clientIp } from "@/lib/ratelimit";
const b = z.object({ tripId: z.string(), contact: z.string().min(7).max(100) });
export async function POST(req: Request) {
  if (limited("w:" + clientIp(req), 5)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db.waitlist.upsert({ where: { tripId_contact: p.data }, update: {}, create: p.data });
  return NextResponse.json({ ok: true });
}
