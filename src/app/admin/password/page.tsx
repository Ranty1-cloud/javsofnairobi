import { redirect } from "next/navigation";
import { requireRole, STAFF } from "@/lib/session";
import { ChangePasswordForm } from "@/components/PasswordForms";
export const metadata = { title: "Change password", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function P() {
  if (!(await requireRole(STAFF))) redirect("/");
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Account</p><h1>Change <span className="red">password</span></h1><p className="mut" style={{ margin: 0 }}>Enter your current password, then choose a new one. No email needed.</p></div></header>
      <section className="panel"><ChangePasswordForm /></section>
    </main>
  );
}
