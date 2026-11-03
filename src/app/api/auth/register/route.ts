import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";
import { limited, clientIp } from "@/lib/ratelimit";
const body = z.object({ name: z.string().min(2).max(80), email: z.string().email().max(160), password: z.string().min(10).max(128), phone: z.string().max(30).optional() });
export async function POST(req: Request) {
  if (limited("reg:" + clientIp(req), 5)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input. Password must be 10 to 128 characters." }, { status: 400 });
  const email = p.data.email.toLowerCase();
  // name/phone ride along as metadata only to fill in the profile on first login. The role is never taken from the client: new profiles are always CUSTOMER.
  const { data, error } = await supabaseServer().auth.signUp({ email, password: p.data.password, options: { data: { name: p.data.name, phone: p.data.phone ?? "" } } });
  if (error) {
    if (error.status === 429) return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
    if (error.code === "weak_password") return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Could not create the account" }, { status: 400 });
  }
  // With email confirmation on (recommended) there is no session until the link in the email is opened.
  // The same message is returned for an already-registered email, so this endpoint cannot be used to find out who has an account.
  if (!data.session) return NextResponse.json({ ok: true, confirm: true, message: "Check your email and click the link to confirm your account, then log in." });
  return NextResponse.json({ ok: true });
}
