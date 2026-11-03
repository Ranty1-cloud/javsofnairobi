import { NextResponse } from "next/server";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase";
export async function POST() {
  if (supabaseConfigured()) await supabaseServer().auth.signOut();
  return NextResponse.json({ ok: true });
}
