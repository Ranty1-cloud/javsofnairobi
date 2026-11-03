import { db } from "@/lib/db";
import SubmitForm from "@/components/SubmitForm";
export const dynamic = "force-dynamic";
export default async function Nganya() {
  const [profiles, news] = await Promise.all([db.nganyaProfile.findMany({ orderBy: { createdAt: "desc" } }), db.article.findMany({ where: { category: "Nganya", publishedAt: { lte: new Date() } }, orderBy: { publishedAt: "desc" }, take: 6 })]);
  return (
    <main className="wrap">
      <h1>Nganya <span style={{ color: "#E50914" }}>Culture</span></h1>
      <h2>Showcase</h2><div className="grid">{profiles.map(n => <div key={n.id} className="card"><h3>{n.name}</h3><p className="mut">{n.crew}</p><p>{n.bio}</p></div>)}{!profiles.length && <p className="mut">Featured Nganyas coming soon.</p>}</div>
      <h2>Nganya news</h2><div className="grid">{news.map(a => <a key={a.id} className="card" href={`/news/${a.slug}`}><h3>{a.title}</h3><p className="mut">{a.excerpt}</p></a>)}{!news.length && <p className="mut">No Nganya stories yet.</p>}</div>
      <h2>Share with the community</h2><p className="mut">Photos, news tips and events are reviewed before publishing. No personal information or unverified claims.</p>
      <SubmitForm endpoint="/api/submissions" extra={{ kind: "nganya" }} fields={["title", "body", "contact"]} label="Submit for review" />
    </main>
  );
}
