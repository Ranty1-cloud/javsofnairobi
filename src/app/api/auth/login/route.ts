import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase";
import { profileFor } from "@/lib/session";
import { limited, clientIp } from "@/lib/ratelimit";
const body = z.object({ email: z.string().email(), password: z.string().max(128) });
export async function POST(req: Request) {
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (limited("login:" + email, 5) || limited("loginip:" + clientIp(req), 20)) return NextResponse.json({ error: "Too many attempts, try again in a minute" }, { status: 429 });
  const { data, error } = await supabaseServer().auth.signInWithPassword({ email, password: p.data.password });
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") return NextResponse.json({ error: "Confirm your email first. Check your inbox for the link." }, { status: 403 });
    await db.auditLog.create({ data: { action: "login.failed", detail: { email } } });
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const u = await profileFor(data.user); // creates/links the app profile on first login
  if (!u) { await supabaseServer().auth.signOut(); return NextResponse.json({ error: "This account is not available" }, { status: 403 }); }
  return NextResponse.json({ ok: true, role: u.role });
}
