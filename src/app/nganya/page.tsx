import Link from "next/link";
import { db } from "@/lib/db";
import SubmitForm from "@/components/SubmitForm";
import TripCard from "@/components/TripCard";
import { toCard, tripInclude, liveArticles } from "@/lib/queries";
export const dynamic = "force-dynamic";
export const metadata = { title: "Nganya Culture", description: "Kenyan matatu culture: news, showcases, events and community stories." };
export default async function Nganya() {
  const [profiles, news, trips] = await Promise.all([
    db.nganyaProfile.findMany({ orderBy: { createdAt: "desc" } }),
    db.article.findMany({ where: { ...liveArticles(), category: { in: ["Nganya", "Nganya Events"] } }, orderBy: { publishedAt: "desc" }, take: 6 }),
    db.trip.findMany({ where: { published: true, departsAt: { gt: new Date() }, category: { contains: "nganya", mode: "insensitive" } }, orderBy: { departsAt: "asc" }, take: 3, include: tripInclude }),
  ]);
  return (
    <>
      <section className="page-hero" style={{ minHeight: "52vh", background: "radial-gradient(900px 500px at 80% 20%,rgba(229,9,20,.3),transparent 60%)" }}>
        <div className="wrap" style={{ width: "100%" }}><p className="eyebrow">Matatu culture</p><h1 className="disp" style={{ fontSize: "clamp(4rem,13vw,10rem)", lineHeight: .88 }}>NGANYA<br /><span className="red">CULTURE</span></h1><p className="mut" style={{ maxWidth: 560 }}>Art on wheels, sound that shakes the street, and crews that make Nairobi move. News, showcases, events and community stories.</p></div>
      </section>
      <div className="wrap">
        <div className="sec-head"><h2>Showcase</h2></div>
        <div className="grid">{profiles.map(n => <article key={n.id} className="card" style={{ padding: 0, overflow: "hidden" }}>{n.imageUrl && <img src={n.imageUrl} alt={n.name} loading="lazy" style={{ aspectRatio: "16/10", objectFit: "cover", width: "100%" }} />}<div style={{ padding: 20 }}><h3 className="disp" style={{ fontSize: "1.9rem", margin: 0 }}>{n.name}</h3>{n.crew && <p className="red" style={{ margin: "2px 0 8px" }}>Crew: {n.crew}</p>}<p className="mut" style={{ margin: 0 }}>{n.bio}</p></div></article>)}{!profiles.length && <div className="empty">Featured Nganyas are added by our editors. Know one that deserves the spotlight? Submit it below.</div>}</div>
        {trips.length > 0 && <><div className="sec-head" style={{ marginTop: 56 }}><h2>Nganya events &amp; trips</h2><Link href="/trips?cat=Nganya">All →</Link></div><div className="grid">{trips.map(t => <TripCard key={t.id} t={toCard(t)} />)}</div></>}
        <div className="sec-head" style={{ marginTop: 56 }}><h2>Nganya news</h2><Link href="/news?c=Nganya">All →</Link></div>
        <div className="grid">{news.map(a => <Link key={a.id} className="card" href={`/news/${a.slug}`}><span className="badge red">{a.category}</span><h3 style={{ marginTop: 10 }}>{a.title}</h3><p className="mut" style={{ margin: 0 }}>{a.excerpt}</p></Link>)}{!news.length && <div className="empty">No Nganya stories yet.</div>}</div>
        <div id="submit" className="two" style={{ marginTop: 64 }}>
          <div><h2>Share with the community</h2><p className="mut">Send photos, news tips, event announcements or crew shout-outs. Everything is reviewed before it goes live. We don&apos;t publish personal information, unverified allegations or content you don&apos;t have the right to share.</p></div>
          <div className="card"><SubmitForm endpoint="/api/submissions" extra={{ kind: "nganya" }} fields={["title", "body", "contact"]} label="Submit for review" /></div>
        </div>
      </div>
    </>
  );
}
