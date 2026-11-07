import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
export const dynamic = "force-dynamic";
// Tells the browser who is signed in (role only), so public pages can show staff a "Back to admin" button without becoming uncacheable.
export async function GET() {
  const s = await getSession();
  return NextResponse.json({ role: s?.role ?? null }, { headers: { "Cache-Control": "no-store" } });
}
