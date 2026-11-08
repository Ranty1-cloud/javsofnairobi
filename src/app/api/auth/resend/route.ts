import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase";
import { limited, clientIp } from "@/lib/ratelimit";

// "Resend confirmation email". Same answer whether or not the address has an account, so it can't be used to find out who is registered.
const GENERIC = { ok: true, message: "If that email is waiting to be confirmed, a new link is on its way. Check your spam folder too." };
export async function POST(req: Request) {
  const p = z.object({ email: z.string().email().max(160) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (limited("rs:" + clientIp(req), 5) || limited("rse:" + email, 3)) return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429 });
  const { error } = await supabaseServer().auth.resend({ type: "signup", email, options: { emailRedirectTo: `${new URL(req.url).origin}/auth/callback?next=/trips` } });
  if (error) console.error("resend confirmation failed:", error.status, error.code, error.message);
  return NextResponse.json(GENERIC);
}
