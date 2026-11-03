import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// Landing point for the default Supabase recovery email: exchanges ?code for a short-lived session, then asks for a new password.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabaseServer().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/reset", url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
