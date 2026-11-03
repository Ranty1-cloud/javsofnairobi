import { ResetForm } from "@/components/PasswordForms";
import { supabaseServer } from "@/lib/supabase";
export const metadata = { title: "Choose a new password", robots: { index: false } };
export const dynamic = "force-dynamic";
// The emailed link goes through /auth/confirm, which signs the person in with a short-lived session. No token is kept in this URL.
export default async function P() {
  const { data: { user } } = await supabaseServer().auth.getUser();
  return <main className="wrap narrow"><h1>New <span className="red">password</span></h1>{user ? <ResetForm /> : <p className="mut">This link is invalid or has expired. <a className="red" href="/forgot">Request a new one</a>.</p>}</main>;
}
