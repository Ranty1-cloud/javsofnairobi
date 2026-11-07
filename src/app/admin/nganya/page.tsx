import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import NganyaManager, { type NganyaRow } from "@/components/NganyaManager";
export const metadata = { title: "Nganya showcase", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function AdminNganya() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"]))) redirect("/admin");
  const list = await db.nganyaProfile.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Content</p><h1>Nganya <span className="red">showcase</span></h1><p className="mut" style={{ margin: 0 }}>The matatus and crews featured on the Nganya Culture page and the homepage.</p></div></header>
      <NganyaManager rows={list.map(n => ({ id: n.id, name: n.name, crew: n.crew ?? "", bio: n.bio, imageUrl: n.imageUrl }))} />
    </main>
  );
}
