import { ResetForm } from "@/components/PasswordForms";
import { getSession } from "@/lib/session";
export const dynamic = "force-dynamic";
export const metadata = { title: "Choose a new password", referrer: "no-referrer", robots: { index: false } };
export default async function P() {
  // The emailed link signs the person in via /auth/callback; without that session there is nothing to reset.
  const s = await getSession();
  return <main className="wrap narrow"><h1>New <span className="red">password</span></h1>{s ? <ResetForm /> : <p className="mut">This link is invalid or has expired. <a className="red" href="/forgot">Request a new one</a>.</p>}</main>;
}
