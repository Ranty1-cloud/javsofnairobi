import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import DestinationsManager, { type DestRow } from "@/components/DestinationsManager";
export const metadata = { title: "Destinations", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Destinations() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"]))) redirect("/admin");
  const list = await db.destination.findMany({ orderBy: [{ region: "asc" }, { name: "asc" }], include: { _count: { select: { trips: true } } } });
  const rows: DestRow[] = list.map(d => ({ id: d.id, slug: d.slug, name: d.name, region: d.region, description: d.description, imageUrl: d.imageUrl, travelTime: d.travelTime, budgetNote: d.budgetNote, activities: d.activities, tips: d.tips, trips: d._count.trips }));
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Content</p><h1>Desti<span className="red">nations</span></h1><p className="mut" style={{ margin: 0 }}>Places are organised by county and town. Write a description and add a photo for each one.</p></div></header>
      <DestinationsManager rows={rows} />
    </main>
  );
}
