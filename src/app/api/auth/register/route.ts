import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase";
import { limited, clientIp } from "@/lib/ratelimit";
const body = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(10).max(128), phone: z.string().optional() });
export async function POST(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Sign up is not configured yet" }, { status: 503 });
  if (limited("reg:" + clientIp(req), 5)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  const { data, error } = await supabaseServer().auth.signUp({
    email, password: p.data.password,
    options: { data: { name: p.data.name }, emailRedirectTo: `${new URL(req.url).origin}/auth/callback?next=/account` },
  });
  if (error || !data.user) return NextResponse.json({ error: error?.message ?? "Could not create account" }, { status: 400 });
  // Supabase returns an empty identities list (and no error) when the email is already registered.
  if (data.user.identities?.length === 0) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  // Profile row; the role is always CUSTOMER here and the client cannot choose it.
  await db.user.upsert({ where: { email }, update: {}, create: { id: data.user.id, email, name: p.data.name, phone: p.data.phone, passwordHash: "managed-by-supabase" } });
  // No session means Supabase is set to require email confirmation first.
  return NextResponse.json({ ok: true, confirm: !data.session });
}
