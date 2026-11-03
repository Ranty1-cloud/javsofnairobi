import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import SubmitForm from "@/components/SubmitForm";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const a = await db.article.findUnique({ where: { slug: params.slug } });
  return { title: a ? `${a.title} | JAVS OF NAIROBI` : "Story", description: a?.excerpt };
}
export default async function Article({ params }: { params: { slug: string } }) {
  const a = await db.article.findUnique({ where: { slug: params.slug }, include: { comments: { where: { approved: true }, orderBy: { createdAt: "asc" } } } });
  if (!a || !a.publishedAt || a.publishedAt > new Date()) notFound();
  const mins = Math.max(1, Math.round(a.body.split(/\s+/).length / 200));
  return (
    <main className="wrap" style={{ maxWidth: 760 }}>
      <small style={{ color: "#E50914" }}>{a.category}</small><h1>{a.title}</h1>
      <p className="mut">{a.publishedAt.toLocaleDateString("en-KE")} · {mins} min read</p>
      {a.body.split("\n\n").map((p, i) => <p key={i} style={{ lineHeight: 1.7 }}>{p}</p>)}
      <h3>Comments</h3>{a.comments.map(c => <p key={c.id}><b>{c.name}</b>: {c.body}</p>)}
      <SubmitForm endpoint="/api/comments" extra={{ articleId: a.id }} fields={["name", "body"]} label="Post comment (reviewed before it appears)" />
    </main>
  );
}
