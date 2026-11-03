import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { limited, clientIp } from "@/lib/ratelimit";
const b = z.object({ articleId: z.string(), name: z.string().min(1).max(60), body: z.string().min(2).max(1000) });
export async function POST(req: Request) {
  if (limited("c:" + clientIp(req), 5)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await db.comment.create({ data: p.data }); // approved=false until a moderator approves
  return NextResponse.json({ ok: true });
}
