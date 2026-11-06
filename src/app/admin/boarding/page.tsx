import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";
export const metadata = { title: "Boarding lists", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Boarding() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT"]))) redirect("/admin");
  const from = new Date(Date.now() - 2 * 86_400_000);
  const trips = await db.trip.findMany({ where: { departsAt: { gte: from } }, orderBy: { departsAt: "asc" }, take: 30, select: { id: true, title: true, departsAt: true } });
  const counts = await Promise.all(trips.map(async t => ({ id: t.id, total: await db.ticket.count({ where: { booking: { tripId: t.id, status: "CONFIRMED" } } }), in: await db.ticket.count({ where: { booking: { tripId: t.id, status: "CONFIRMED" }, checkedInAt: { not: null } } }) })));
  const c = new Map(counts.map(x => [x.id, x]));
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Operations</p><h1>Boarding <span className="red">lists</span></h1><p className="mut" style={{ margin: 0 }}>Pick a trip to see who is coming and check people in.</p></div><Link className="btn sm" href="/admin/scan">Open scanner</Link></header>
      <section className="panel">
        {trips.length ? <ul className="occ">{trips.map(t => { const x = c.get(t.id)!, pct = x.total ? Math.round((x.in / x.total) * 100) : 0; return (
          <li key={t.id}><div className="hb-top"><Link href={`/admin/boarding/${t.id}`}>{t.title}</Link><b>{x.in}/{x.total} boarded</b></div><div className="meter"><div className="m-fill" style={{ width: `${pct}%` }} /></div><small className="mut">{fmtDateTime(t.departsAt)}</small></li>
        ); })}</ul> : <p className="mut">No trips in the last two days or coming up.</p>}
      </section>
    </main>
  );
}
