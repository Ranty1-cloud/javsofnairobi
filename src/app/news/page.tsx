import { ARTICLE_CATS } from "@/lib/content";
import Link from "next/link";
import { db } from "@/lib/db";
import { liveArticles } from "@/lib/queries";
import { fmtDate, readMins } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import { pageMeta, webPageLd, breadcrumbLd, graph } from "@/lib/seo";
export const dynamic = "force-dynamic";
const DESC = "Travel updates, destination guides, event announcements and Nganya (Kenyan matatu culture) news from JAVS OF NAIROBI.";
export const generateMetadata = ({ searchParams }: { searchParams: { c?: string; q?: string } }) => pageMeta({ title: "News & Stories", description: DESC, path: "/news", noindex: !!(searchParams.c || searchParams.q) });
const CATS = [...ARTICLE_CATS];
export default async function News({ searchParams }: { searchParams: { c?: string; q?: string } }) {
  const items = await db.article.findMany({ where: { ...liveArticles(), ...(searchParams.c ? { category: searchParams.c } : {}), ...(searchParams.q ? { OR: [{ title: { contains: searchParams.q, mode: "insensitive" } }, { excerpt: { contains: searchParams.q, mode: "insensitive" } }] } : {}) }, orderBy: { publishedAt: "desc" }, take: 30 });
  const [lead, ...rest] = items;
  return <div className="wrap"><JsonLd data={graph(webPageLd({ path: "/news", name: "News & Stories", description: DESC, type: "CollectionPage" }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "News & Stories", path: "/news" }]))} /><p className="eyebrow">Editorial</p><h1 className="disp" style={{ fontSize: "clamp(2.8rem,7vw,5rem)" }}>News &amp; <span className="red">Stories</span></h1>
    <div className="chips"><Link href="/news" className={`chip ${!searchParams.c ? "on" : ""}`}>All</Link>{CATS.map(c => <Link key={c} href={`/news?c=${c}`} className={`chip ${searchParams.c === c ? "on" : ""}`}>{c}</Link>)}
      <form action="/news" style={{ marginLeft: "auto" }}>{searchParams.c && <input type="hidden" name="c" value={searchParams.c} />}<input name="q" defaultValue={searchParams.q} placeholder="Search stories" aria-label="Search stories" style={{ margin: 0, minHeight: 36, borderRadius: 99, padding: "6px 14px" }} /></form></div>
    {lead && <Link href={`/news/${lead.slug}`} className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 18 }}><div className="two" style={{ gap: 0, alignItems: "stretch" }}>{lead.coverUrl && <img src={lead.coverUrl} alt={lead.title} style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 240 }} />}<div style={{ padding: 28 }}><span className="badge red">Featured · {lead.category}</span><h2 style={{ marginTop: 12 }}>{lead.title}</h2><p className="mut">{lead.excerpt}</p><small className="mut">{fmtDate(lead.publishedAt!)} · {readMins(lead.body)} min read</small></div></div></Link>}
    <div className="grid">{rest.map(a => <Link key={a.id} className="card" href={`/news/${a.slug}`} style={{ padding: 0, overflow: "hidden" }}>{a.coverUrl && <img src={a.coverUrl} alt="" loading="lazy" style={{ aspectRatio: "16/9", objectFit: "cover", width: "100%" }} />}<div style={{ padding: 20 }}><span className="badge red">{a.category}</span><h3 style={{ marginTop: 10 }}>{a.title}</h3><p className="mut" style={{ margin: 0 }}>{a.excerpt}</p><small className="mut">{fmtDate(a.publishedAt!)} · {readMins(a.body)} min</small></div></Link>)}
      {!items.length && <div className="empty">No stories yet. Check back soon.</div>}</div></div>;
}
