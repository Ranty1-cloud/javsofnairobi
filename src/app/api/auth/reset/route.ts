import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase";
import { limited, clientIp } from "@/lib/ratelimit";
// The emailed link was already exchanged for a short-lived session by /auth/confirm, so this only needs the new password.
export async function POST(req: Request) {
  if (limited("rs:" + clientIp(req), 10)) return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  const p = z.object({ password: z.string().min(10).max(128) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Password must be 10 to 128 characters" }, { status: 400 });
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "This link is invalid or has expired. Request a new one." }, { status: 400 });
  const { error } = await sb.auth.updateUser({ password: p.data.password });
  if (error) return NextResponse.json({ error: error.code === "weak_password" || error.code === "same_password" ? error.message : "Could not update the password" }, { status: 400 });
  await sb.auth.signOut({ scope: "others" }); // kick any other device that was signed in with the old password
  await db.auditLog.create({ data: { actor: user.id, action: "password.reset_done" } });
  return NextResponse.json({ ok: true });
}
