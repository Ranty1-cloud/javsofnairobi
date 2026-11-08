import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// Landing point for Supabase emails that use the default link: exchanges ?code for a session.
// Password-reset emails (no ?next) go on to /reset; sign-up confirmations carry ?next=/trips and go there instead.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabaseServer().auth.exchangeCodeForSession(code);
    const next = url.searchParams.get("next") ?? "";
    if (!error) return NextResponse.redirect(new URL(next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/reset", url.origin)); // same-site paths only
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
