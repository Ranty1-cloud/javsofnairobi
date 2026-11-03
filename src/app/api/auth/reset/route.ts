import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase";
import { limited, clientIp } from "@/lib/ratelimit";
const body = z.object({ password: z.string().min(10).max(128) });
const BAD = () => NextResponse.json({ error: "This link is invalid or has expired. Request a new one." }, { status: 400 });
export async function POST(req: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Not configured yet" }, { status: 503 });
  if (limited("rs:" + clientIp(req), 10)) return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Password must be 10 to 128 characters" }, { status: 400 });
  const sb = supabaseServer();
  // The emailed link signs the person in (see /auth/callback); this only works for that recovery session.
  const { data } = await sb.auth.getUser();
  if (!data.user) return BAD();
  const { error } = await sb.auth.updateUser({ password: p.data.password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await db.auditLog.create({ data: { actor: data.user.id, action: "password.reset_done" } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
