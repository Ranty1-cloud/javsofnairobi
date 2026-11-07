import { ResetForm } from "@/components/PasswordForms";
import { supabaseServer } from "@/lib/supabase";
export const metadata = { title: "Choose a new password", robots: { index: false } };
export const dynamic = "force-dynamic";
// The emailed link goes through /auth/confirm, which signs the person in with a short-lived session. No token is kept in this URL.
export default async function P() {
  const { data: { user } } = await supabaseServer().auth.getUser();
  return <main className="wrap narrow"><h1>New <span className="red">password</span></h1>{user ? <><p className="mut">Choose a new password for <b>{user.email}</b>.</p><ResetForm /></> : <div className="auth-card"><h2>Link expired</h2><p className="mut">This reset link is invalid or has already been used. Links last 1 hour and work once.</p><a className="btn" href="/forgot">Request a new link</a></div>}</main>;
}
