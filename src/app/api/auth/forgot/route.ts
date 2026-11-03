import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase";
import { limited, clientIp } from "@/lib/ratelimit";
const GENERIC = { ok: true, message: "If that email has an account, a reset link is on its way. It expires in 1 hour." };
export async function POST(req: Request) {
  const p = z.object({ email: z.string().email().max(160) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (limited("fp:" + clientIp(req), 5) || limited("fpe:" + email, 3)) return NextResponse.json({ error: "Too many requests, try again later" }, { status: 429 });
  if (!supabaseConfigured()) { console.error("password reset requested but Supabase is not configured"); return NextResponse.json(GENERIC); }
  // Supabase sends the email. The same response goes out whether or not the account exists.
  const { error } = await supabaseServer().auth.resetPasswordForEmail(email, { redirectTo: `${new URL(req.url).origin}/auth/callback?next=/reset` });
  if (error) console.error("reset email failed", error.message);
  return NextResponse.json(GENERIC);
}
