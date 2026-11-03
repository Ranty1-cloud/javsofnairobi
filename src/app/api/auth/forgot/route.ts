import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { limited, clientIp } from "@/lib/ratelimit";
import { sendMail, shell, button, emailConfigured } from "@/lib/email";
import { site } from "@/lib/format";
const GENERIC = { ok: true, message: "If that email has an account, a reset link is on its way. It expires in 1 hour." };
export async function POST(req: Request) {
  const p = z.object({ email: z.string().email().max(160) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (limited("fp:" + clientIp(req), 5) || limited("fpe:" + email, 3)) return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429 });
  const u = await db.user.findFirst({ where: { email, deletedAt: null } });
  // Same response whether or not the account exists, so this endpoint cannot be used to find out who has an account.
  if (!u) return NextResponse.json(GENERIC);
  if (!emailConfigured()) { console.error("password reset requested but SMTP is not configured"); return NextResponse.json(GENERIC); }
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await db.$transaction([
    db.passwordReset.updateMany({ where: { userId: u.id, usedAt: null }, data: { usedAt: now } }), // only the newest link works
    db.passwordReset.create({ data: { userId: u.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(now.getTime() + 3600_000) } }),
    db.auditLog.create({ data: { actor: u.id, action: "password.reset_requested" } }),
  ]);
  const link = `${site()}/reset?token=${token}`;
  const r = await sendMail({ to: u.email, subject: "Reset your JAVS OF NAIROBI password", text: `Reset your password (valid for 1 hour): ${link}\n\nIf you did not ask for this, ignore this email.`,
    html: shell("Reset your password", `<p style="color:#ddd">Use the button below to choose a new password. The link works once and expires in 1 hour.</p>${button(link, "Choose a new password")}<p style="color:#A1A1A1;font-size:12px">If you did not ask for this, ignore this email. Your password stays the same.</p>`) });
  if (!r.ok) console.error("reset email failed", r.error);
  return NextResponse.json(GENERIC);
}
