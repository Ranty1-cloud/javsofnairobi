import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import ArticlesManager, { type ArticleRow } from "@/components/ArticlesManager";
export const metadata = { title: "Articles", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Articles() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"]))) redirect("/admin");
  const list = await db.article.findMany({ where: { archivedAt: null }, orderBy: [{ publishedAt: "desc" }, { title: "asc" }], take: 300, include: { _count: { select: { comments: true } } } });
  const rows: ArticleRow[] = list.map(a => ({ id: a.id, slug: a.slug, title: a.title, category: a.category, excerpt: a.excerpt, body: a.body, coverUrl: a.coverUrl, author: a.author, publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null, comments: a._count.comments }));
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Content</p><h1>News &amp; <span className="red">stories</span></h1><p className="mut" style={{ margin: 0 }}>Write, edit, publish and remove the stories on the News page. Drafts stay hidden until you publish them.</p></div></header>
      <ArticlesManager rows={rows} />
    </main>
  );
}
