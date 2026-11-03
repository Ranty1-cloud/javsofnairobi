import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase";
const TYPES = ["email", "signup", "invite", "recovery", "magiclink"];
// Works across devices (no PKCE cookie needed): the email template links here with the token hash.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const token_hash = sp.get("token_hash"), type = sp.get("type");
  if (token_hash && type && TYPES.includes(type)) {
    const { error } = await supabaseServer().auth.verifyOtp({ type: type as EmailOtpType, token_hash });
    if (!error) {
      if (type === "recovery" || type === "invite") redirect("/reset"); // always choose a password next; ignore any "next" param
      const next = sp.get("next") ?? "";
      redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/trips"); // only same-site paths
    }
  }
  redirect("/login?error=link");
}
