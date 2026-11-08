import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import SubmitForm from "@/components/SubmitForm";
import { liveArticles } from "@/lib/queries";
import { fmtDate, readMins, site } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { pageMeta, webPageLd, breadcrumbLd, articleLd, graph, clip } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const a = await db.article.findFirst({ where: { slug: params.slug, ...liveArticles() } });
  return a ? pageMeta({ title: a.title, description: clip(a.excerpt || a.title), path: `/news/${a.slug}`, image: a.coverUrl, type: "article", published: a.publishedAt?.toISOString() }) : {};
}
export default async function Article({ params }: { params: { slug: string } }) {
  const a = await db.article.findFirst({ where: { slug: params.slug, ...liveArticles() }, include: { comments: { where: { approved: true }, orderBy: { createdAt: "asc" } } } });
  if (!a) notFound();
  const related = await db.article.findMany({ where: { ...liveArticles(), category: a.category, id: { not: a.id } }, take: 3, orderBy: { publishedAt: "desc" } });
  const url = encodeURIComponent(`${site()}/news/${a.slug}`), text = encodeURIComponent(a.title);
  const crumbs = [{ name: "Home", path: "/" }, { name: "News & Stories", path: "/news" }, { name: a.title, path: `/news/${a.slug}` }];
  const ld = graph(webPageLd({ path: `/news/${a.slug}`, name: a.title, description: clip(a.excerpt || a.title) }), breadcrumbLd(crumbs), articleLd({ ...a, publishedAt: a.publishedAt! }));
  return (
    <div className="wrap">
      <JsonLd data={ld} />
      <div className="narrow">
        <Breadcrumbs items={crumbs} />
        <span className="badge red">{a.category}</span><h1 style={{ fontSize: "clamp(2rem,5vw,3.4rem)", marginTop: 12 }}>{a.title}</h1>
        <p className="mut">By {a.author} · <time dateTime={a.publishedAt!.toISOString()}>{fmtDate(a.publishedAt!)}</time> · {readMins(a.body)} min read</p>
        {a.coverUrl && <img src={a.coverUrl} alt={a.title} fetchPriority="high" decoding="async" style={{ borderRadius: 14, margin: "20px 0", width: "100%" }} />}
        <div className="prose">{a.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>
        <p className="mut" style={{ fontSize: ".85rem" }}>Published by JAVS OF NAIROBI. Spotted a mistake or want to add a source? Tell us on the <Link className="red" href="/support">Support page</Link> and we will review it.</p>
        <p className="mut">Share: <a className="red" href={`https://wa.me/?text=${text}%20${url}`} target="_blank" rel="noreferrer">WhatsApp</a> · <a className="red" href={`https://twitter.com/intent/tweet?text=${text}&url=${url}`} target="_blank" rel="noreferrer">X</a> · <a className="red" href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noreferrer">Facebook</a></p>
        <h3 style={{ marginTop: 40 }}>Comments</h3>{a.comments.map(c => <p key={c.id}><b>{c.name}</b>: {c.body}</p>)}{!a.comments.length && <p className="mut">No comments yet.</p>}
        <SubmitForm endpoint="/api/comments" extra={{ articleId: a.id }} fields={["name", "body"]} label="Post comment (reviewed before it appears)" />
      </div>
      {related.length > 0 && <><h2 style={{ marginTop: 56 }}>Related stories</h2><div className="grid">{related.map(r => <Link key={r.id} href={`/news/${r.slug}`} className="card"><h3>{r.title}</h3><p className="mut" style={{ margin: 0 }}>{r.excerpt}</p></Link>)}</div></>}
    </div>
  );
}
