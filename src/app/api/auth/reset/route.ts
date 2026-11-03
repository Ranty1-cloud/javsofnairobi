import { NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { limited, clientIp } from "@/lib/ratelimit";
const body = z.object({ token: z.string().min(20).max(100), password: z.string().min(10).max(128) });
// A function, not a shared constant: a Response body can only be read once, so each request needs its own instance.
const BAD = () => NextResponse.json({ error: "This link is invalid or has expired. Request a new one." }, { status: 400 });
export async function POST(req: Request) {
  if (limited("rs:" + clientIp(req), 10)) return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Password must be 10 to 128 characters" }, { status: 400 });
  const tokenHash = createHash("sha256").update(p.data.token).digest("hex");
  const row = await db.passwordReset.findUnique({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return BAD();
  const passwordHash = await argon2.hash(p.data.password, { type: argon2.argon2id });
  try {
    await db.$transaction(async tx => {
      // Conditional claim: two simultaneous submissions cannot both consume the same link.
      const c = await tx.passwordReset.updateMany({ where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
      if (!c.count) throw new Error("claimed");
      await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
      await tx.passwordReset.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: new Date() } });
      await tx.auditLog.create({ data: { actor: row.userId, action: "password.reset_done" } });
    });
  } catch { return BAD(); }
  return NextResponse.json({ ok: true });
}
