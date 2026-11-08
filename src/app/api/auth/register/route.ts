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
  const { data, error } = await supabaseServer().auth.signUp({ email, password: p.data.password, options: { data: { name: p.data.name, phone: p.data.phone ?? "" }, emailRedirectTo: `${new URL(req.url).origin}/auth/callback?next=/trips` } });
  if (error) {
    console.error("signup failed:", error.status, error.code, error.message); // the real reason shows up in your Vercel logs
    if (error.status === 429 || error.code === "over_email_send_rate_limit") return NextResponse.json({ error: "We're sending a lot of emails right now. Please wait a few minutes and try again." }, { status: 429 });
    if (error.code === "weak_password") return NextResponse.json({ error: error.message }, { status: 400 });
    // Supabase could not send the confirmation email (email service not set up for this address, bad SMTP settings, etc.)
    if (error.code === "email_address_not_authorized" || /sending.*email/i.test(error.message)) return NextResponse.json({ error: "We couldn't send your confirmation email right now. Please try again in a few minutes, or contact support on WhatsApp." }, { status: 503 });
    return NextResponse.json({ error: "Could not create the account" }, { status: 400 });
  }
  // With email confirmation on (recommended) there is no session until the link in the email is opened.
  // The same message is returned for an already-registered email, so this endpoint cannot be used to find out who has an account.
  if (!data.session) return NextResponse.json({ ok: true, confirm: true, message: "We've sent a confirmation link to your email. It can take a few minutes, so check your spam or promotions folder too." });
  return NextResponse.json({ ok: true });
}
