import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/session";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase";
import { limited, clientIp } from "@/lib/ratelimit";
const body = z.object({ email: z.string().email(), password: z.string().max(128) });
export async function POST(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Login is not configured yet" }, { status: 503 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (limited("login:" + email, 5) || limited("loginip:" + clientIp(req), 20)) return NextResponse.json({ error: "Too many attempts, try again in a minute" }, { status: 429 });
  const { data, error } = await supabaseServer().auth.signInWithPassword({ email, password: p.data.password });
  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes("not confirmed")) return NextResponse.json({ error: "Please confirm your email first. Check your inbox for the link." }, { status: 403 });
    await db.auditLog.create({ data: { action: "login.failed", detail: { email } } }).catch(() => null);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const u = await ensureUser(data.user);
  return NextResponse.json({ ok: true, role: u?.role ?? "CUSTOMER" });
}
