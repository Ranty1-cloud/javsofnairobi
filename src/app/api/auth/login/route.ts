import { NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import { db } from "@/lib/db";
import { startSession } from "@/lib/session";
import { limited, clientIp } from "@/lib/ratelimit";
const body = z.object({ email: z.string().email(), password: z.string().max(128) });
export async function POST(req: Request) {
  const p = body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (limited("login:" + email, 5) || limited("loginip:" + clientIp(req), 20)) return NextResponse.json({ error: "Too many attempts, try again in a minute" }, { status: 429 });
  const u = await db.user.findFirst({ where: { email, deletedAt: null } });
  const ok = u ? await argon2.verify(u.passwordHash, p.data.password) : false;
  if (!u || !ok) { await db.auditLog.create({ data: { action: "login.failed", detail: { email } } }); return NextResponse.json({ error: "Invalid credentials" }, { status: 401 }); }
  await startSession(u.id, u.role);
  return NextResponse.json({ ok: true, role: u.role });
}
