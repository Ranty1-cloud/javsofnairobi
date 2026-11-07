import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { limited, clientIp } from "@/lib/ratelimit";

// Change password while signed in. No email involved: the person proves who they are with their CURRENT password.
// (A reset that only needs an email address would let anyone take over any account, so that is deliberately not offered.)
const body = z.object({ current: z.string().min(1).max(128), password: z.string().min(10).max(128) });

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  if (limited("chpw:" + s.userId, 5) || limited("chpwip:" + clientIp(req), 20)) return NextResponse.json({ error: "Too many attempts, try again in a minute." }, { status: 429 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "New password must be 10 to 128 characters." }, { status: 400 });
  if (p.data.current === p.data.password) return NextResponse.json({ error: "Your new password must be different from the current one." }, { status: 400 });

  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  // Check the current password with a throwaway client so the visitor's own session cookies are untouched.
  const check = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: badPw } = await check.auth.signInWithPassword({ email: user.email, password: p.data.current });
  if (badPw) return NextResponse.json({ error: "Your current password is not correct." }, { status: 400 });

  const { error } = await sb.auth.updateUser({ password: p.data.password });
  if (error) {
    if (error.code === "weak_password") return NextResponse.json({ error: error.message }, { status: 400 });
    if (error.code === "same_password") return NextResponse.json({ error: "Your new password must be different from the current one." }, { status: 400 });
    if (error.code === "reauthentication_needed") return NextResponse.json({ error: "For security, log out, log back in, then try again." }, { status: 400 });
    console.error("change password failed", error.message);
    return NextResponse.json({ error: "Could not update the password." }, { status: 500 });
  }
  await sb.auth.signOut({ scope: "others" }); // any other device signed in with the old password is logged out
  await db.auditLog.create({ data: { actor: s.userId, action: "password.changed" } });
  return NextResponse.json({ ok: true });
}
