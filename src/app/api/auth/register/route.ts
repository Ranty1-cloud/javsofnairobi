import { NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import { db } from "@/lib/db";
import { startSession } from "@/lib/session";
import { limited, clientIp } from "@/lib/ratelimit";
const body = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(10).max(128), phone: z.string().optional() });
export async function POST(req: Request) {
  if (limited("reg:" + clientIp(req), 5)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const p = body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  const u = await db.user.create({ data: { name: p.data.name, email, phone: p.data.phone, passwordHash: await argon2.hash(p.data.password, { type: argon2.argon2id }) } });
  await startSession(u.id, u.role); // role is always CUSTOMER here; the client cannot choose it
  return NextResponse.json({ ok: true });
}
