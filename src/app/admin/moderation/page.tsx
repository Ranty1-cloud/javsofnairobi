import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import ModerationList from "@/components/ModerationList";
export const dynamic = "force-dynamic";
export default async function Mod() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"]))) redirect("/");
  const [s, c, rv] = await Promise.all([db.submission.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } }), db.comment.findMany({ where: { approved: false }, orderBy: { createdAt: "asc" } }), db.review.findMany({ where: { approved: false }, orderBy: { createdAt: "asc" } })]);
  const items = [...s.map(x => ({ type: "submission" as const, id: x.id, title: `${x.kind}: ${x.title}`, body: x.body })), ...rv.map(x => ({ type: "review" as const, id: x.id, title: `${x.name}: ${x.rating}/5`, body: x.body })), ...c.map(x => ({ type: "comment" as const, id: x.id, title: x.name, body: x.body }))];
  return <main className="wrap"><h1>Moderation <span style={{ color: "#E50914" }}>Queue</span></h1><ModerationList items={items} /></main>;
}
