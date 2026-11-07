import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import StaffManager from "@/components/StaffManager";
export const metadata = { title: "Staff", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Staff() {
  const me = await requireRole(["SUPER_ADMIN"]);
  if (!me) redirect("/admin");
  const rows = await db.user.findMany({ where: { role: { not: "CUSTOMER" }, deletedAt: null }, orderBy: { createdAt: "asc" }, select: { email: true, name: true, role: true, createdAt: true } });
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Access</p><h1>Staff <span className="red">&amp; roles</span></h1><p className="mut" style={{ margin: 0 }}>Invite your team and decide what each person can do. Every change is written to the audit log.</p></div></header>
      <StaffManager me={me.email} staff={rows.map(r => ({ email: r.email, name: r.name, role: r.role, since: r.createdAt.toISOString() }))} />
    </main>
  );
}
