import Link from "next/link";
import { db } from "@/lib/db";
import Countdown from "@/components/Countdown";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [trips, news, nganya] = await Promise.all([
    db.trip.findMany({ where: { published: true, departsAt: { gt: new Date() } }, orderBy: { departsAt: "asc" }, take: 3 }),
    db.article.findMany({ where: { publishedAt: { lte: new Date() } }, orderBy: { publishedAt: "desc" }, take: 3 }),
    db.nganyaProfile.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const next = trips[0];
  return (
    <>
      <section className="wrap" style={{ minHeight: "70vh", display: "grid", alignContent: "center", gap: 12 }}>
        <p className="mut" style={{ letterSpacing: 4 }}>TRAVEL. EXPERIENCE. CONNECT.</p>
        <h1 style={{ fontSize: "clamp(3rem,9vw,8rem)", lineHeight: 0.95, margin: 0 }}>ADVENTURE.<br />CULTURE.<br /><span style={{ color: "#E50914" }}>NAIROBI.</span></h1>
        <p className="mut" style={{ maxWidth: 520 }}>Discover Kenya differently. Experience unforgettable road trips, hidden destinations, and the culture that brings us together.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><Link className="btn" href="/trips">EXPLORE TRIPS</Link><Link className="btn" style={{ background: "#171717" }} href="/destinations">DISCOVER DESTINATIONS</Link><Link className="btn" style={{ background: "#171717" }} href="/nganya">EXPLORE NGANYA CULTURE</Link></div>
        {next && <div className="card" style={{ maxWidth: 420 }}><small className="mut">NEXT ADVENTURE{next.isSample && " · SAMPLE"}</small><h3>{next.title}</h3><Countdown to={next.departsAt.toISOString()} /></div>}
      </section>
      <section className="wrap"><h2>Upcoming trips</h2><div className="grid">{trips.map(t => <Link key={t.id} className="card" href={`/trips/${t.slug}`}><h3>{t.title}</h3><p className="mut">{t.departsAt.toLocaleDateString("en-KE")}</p><b>From KSh {t.priceKes.toLocaleString()}</b></Link>)}{!trips.length && <p className="mut">No upcoming trips yet.</p>}</div></section>
      <section className="wrap"><h2>Nganya spotlight</h2><div className="grid">{nganya.map(n => <Link key={n.id} className="card" href="/nganya"><h3>{n.name}</h3><p className="mut">{n.crew}</p></Link>)}{!nganya.length && <p className="mut">Showcase coming soon.</p>}</div></section>
      <section className="wrap"><h2>Latest news</h2><div className="grid">{news.map(a => <Link key={a.id} className="card" href={`/news/${a.slug}`}><small style={{ color: "#E50914" }}>{a.category}</small><h3>{a.title}</h3><p className="mut">{a.excerpt}</p></Link>)}{!news.length && <p className="mut">No stories published yet.</p>}</div></section>
    </>
  );
}
