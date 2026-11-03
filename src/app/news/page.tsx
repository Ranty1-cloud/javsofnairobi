import Link from "next/link";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function News({ searchParams }: { searchParams: { c?: string } }) {
  const items = await db.article.findMany({ where: { publishedAt: { lte: new Date() }, ...(searchParams.c ? { category: searchParams.c } : {}) }, orderBy: { publishedAt: "desc" }, take: 30 });
  return <main className="wrap"><h1>News &amp; Stories</h1><p>{["Nganya", "Travel", "Events", "Guides"].map(c => <Link key={c} href={`/news?c=${c}`} className="mut" style={{ marginRight: 14 }}>{c}</Link>)}<Link href="/news">All</Link></p>
    <div className="grid">{items.map(a => <Link key={a.id} className="card" href={`/news/${a.slug}`}><small style={{ color: "#E50914" }}>{a.category}</small><h3>{a.title}</h3><p className="mut">{a.excerpt}</p></Link>)}{!items.length && <p className="mut">No stories yet. Check back soon.</p>}</div></main>;
}
