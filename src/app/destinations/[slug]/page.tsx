import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import TripCard from "@/components/TripCard";
import { toCard, tripInclude, liveArticles } from "@/lib/queries";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const d = await db.destination.findUnique({ where: { slug: params.slug } });
  return d ? { title: d.name, description: d.description.slice(0, 160), openGraph: { images: d.imageUrl ? [d.imageUrl] : undefined } } : {};
}
export default async function Dest({ params }: { params: { slug: string } }) {
  const d = await db.destination.findUnique({ where: { slug: params.slug }, include: { trips: { where: { published: true, departsAt: { gt: new Date() } }, orderBy: { departsAt: "asc" }, include: tripInclude } } });
  if (!d) notFound();
  const related = await db.article.findMany({ where: { ...liveArticles(), OR: [{ title: { contains: d.name, mode: "insensitive" } }, { body: { contains: d.name, mode: "insensitive" } }] }, take: 3, orderBy: { publishedAt: "desc" } });
  const acts = d.activities.split(",").map(s => s.trim()).filter(Boolean);
  return (
    <>
      <section className="page-hero">{d.imageUrl && <img src={d.imageUrl} alt="" />}<div className="wrap" style={{ width: "100%", paddingBottom: 32 }}><p className="eyebrow">{d.region || "Destination"}</p><h1 className="disp">{d.name}</h1></div></section>
      <div className="wrap">
        <div className="facts">{d.travelTime && <div><small>Travel time from Nairobi</small>{d.travelTime}</div>}{d.budgetNote && <div><small>Estimated budget</small>{d.budgetNote}</div>}{acts.length > 0 && <div><small>Activities</small>{acts.join(" · ")}</div>}</div>
        <div className="two"><div className="prose">{d.description.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}{d.tips && <p className="note">Travel tips: {d.tips}</p>}</div>
          {d.lat != null && d.lng != null && <div><iframe title={`Map of ${d.name}`} loading="lazy" style={{ border: 0, width: "100%", height: 320, borderRadius: 14 }} src={`https://www.openstreetmap.org/export/embed.html?bbox=${d.lng - 0.3}%2C${d.lat - 0.2}%2C${d.lng + 0.3}%2C${d.lat + 0.2}&marker=${d.lat}%2C${d.lng}`} /><p><a className="red" href={`https://www.google.com/maps?q=${d.lat},${d.lng}`} target="_blank" rel="noreferrer">Open in Google Maps →</a></p></div>}</div>
        <h2 style={{ marginTop: 40 }}>Upcoming trips to {d.name}</h2>
        <div className="grid">{d.trips.map(t => <TripCard key={t.id} t={toCard(t)} />)}{!d.trips.length && <div className="empty">None scheduled yet. <Link className="red" href="/trips">See all trips</Link></div>}</div>
        {related.length > 0 && <><h2 style={{ marginTop: 40 }}>Related stories</h2><div className="grid">{related.map(a => <Link key={a.id} href={`/news/${a.slug}`} className="card"><span className="badge red">{a.category}</span><h3 style={{ marginTop: 10 }}>{a.title}</h3><p className="mut" style={{ margin: 0 }}>{a.excerpt}</p></Link>)}</div></>}
      </div>
    </>
  );
}
