import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { limited, clientIp } from "@/lib/ratelimit";
export async function POST(req: Request) {
  if (limited("nl:" + clientIp(req), 4)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const p = z.object({ email: z.string().email().max(160) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  await db.subscriber.upsert({ where: { email: p.data.email.toLowerCase() }, update: {}, create: { email: p.data.email.toLowerCase() } });
  return NextResponse.json({ ok: true });
}
