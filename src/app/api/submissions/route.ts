import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { limited } from "@/lib/ratelimit";
const b = z.object({ kind: z.enum(["nganya", "news", "event", "photo"]), title: z.string().min(2).max(120), body: z.string().min(5).max(2000), contact: z.string().max(120).optional() });
export async function POST(req: Request) {
  if (limited("s:" + (req.headers.get("x-forwarded-for") ?? "ip"), 3)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db.submission.create({ data: p.data });
  return NextResponse.json({ ok: true });
}
