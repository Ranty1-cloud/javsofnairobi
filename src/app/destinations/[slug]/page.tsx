import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function Dest({ params }: { params: { slug: string } }) {
  const d = await db.destination.findUnique({ where: { slug: params.slug }, include: { trips: { where: { published: true, departsAt: { gt: new Date() } } } } });
  if (!d) notFound();
  return <main className="wrap"><h1>{d.name}</h1><p>{d.description}</p>
    {d.lat != null && <iframe title="Map" loading="lazy" style={{ border: 0, width: "100%", maxWidth: 720, height: 320, borderRadius: 14 }} src={`https://www.openstreetmap.org/export/embed.html?bbox=${d.lng! - 0.3}%2C${d.lat - 0.2}%2C${d.lng! + 0.3}%2C${d.lat + 0.2}&marker=${d.lat}%2C${d.lng}`} />}
    <h2>Upcoming trips here</h2><div className="grid">{d.trips.map(t => <Link key={t.id} className="card" href={`/trips/${t.slug}`}><h3>{t.title}</h3><b>KSh {t.priceKes.toLocaleString()}</b></Link>)}{!d.trips.length && <p className="mut">None scheduled.</p>}</div></main>;
}
