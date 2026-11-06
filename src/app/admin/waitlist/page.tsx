import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";
export const metadata = { title: "Waitlist", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Waitlist() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT"]))) redirect("/admin");
  const [entries, trips] = await Promise.all([
    db.waitlist.findMany({ orderBy: { createdAt: "asc" }, take: 500 }),
    db.trip.findMany({ where: { departsAt: { gte: new Date(Date.now() - 86_400_000) } }, select: { id: true, title: true, slug: true, departsAt: true, _count: { select: { seats: { where: { status: "AVAILABLE" } } } } }, orderBy: { departsAt: "asc" } }),
  ]);
  const by = new Map<string, typeof entries>();
  entries.forEach(e => by.set(e.tripId, [...(by.get(e.tripId) ?? []), e]));
  const groups = trips.filter(t => by.has(t.id));
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Demand</p><h1>Trip <span className="red">waitlists</span></h1><p className="mut" style={{ margin: 0 }}>People waiting for a seat, oldest first. Contact them when seats open up.</p></div></header>
      {groups.length ? groups.map(t => (
        <section className="panel" key={t.id}>
          <div className="panel-head"><h2><Link href={`/trips/${t.slug}`}>{t.title}</Link></h2><span className="mut">{fmtDateTime(t.departsAt)} · {t._count.seats} seat{t._count.seats === 1 ? "" : "s"} free</span></div>
          <table className="tbl"><thead><tr><th>#</th><th>Contact</th><th>Joined</th><th /></tr></thead><tbody>
            {by.get(t.id)!.map((e, i) => <tr key={e.id}><td>{i + 1}</td><td>{e.contact}</td><td>{fmtDateTime(e.createdAt)}</td><td style={{ textAlign: "right" }}>{/^[+\d][\d\s-]{6,}$/.test(e.contact) ? <a className="btn ghost sm" href={`https://wa.me/${e.contact.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a> : e.contact.includes("@") ? <a className="btn ghost sm" href={`mailto:${e.contact}`}>Email</a> : null}{e.notifiedAt && <small className="mut" style={{ marginLeft: 8 }}>Notified</small>}</td></tr>)}
          </tbody></table>
        </section>
      )) : <section className="panel"><p className="mut" style={{ margin: 0 }}>Nobody is on a waitlist right now. Waitlist sign-up appears on a trip once it is full.</p></section>}
    </main>
  );
}
