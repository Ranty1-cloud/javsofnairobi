import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ChangePasswordForm } from "@/components/PasswordForms";
export const metadata = { title: "Change password", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function P() {
  if (!(await getSession())) redirect("/login");
  return <main className="wrap narrow"><h1>Change <span className="red">password</span></h1><p className="mut">Enter your current password, then choose a new one. No email needed.</p><ChangePasswordForm /><p className="mut"><Link href="/account">← Back to my account</Link></p></main>;
}
