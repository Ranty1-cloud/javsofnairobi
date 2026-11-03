import { NextResponse } from "next/server";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase";
// Supabase email links (confirm sign-up, reset password) land here with a one-time code that becomes a session.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/"; // never redirect off-site
  if (code && supabaseConfigured()) {
    const { error } = await supabaseServer().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safe, req.url));
  }
  return NextResponse.redirect(new URL(safe === "/reset" ? "/forgot" : "/login", req.url));
}
