import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { refreshSite } from "@/lib/refresh";
import { uniqueSlug } from "@/lib/destinations";
import { ARTICLE_CATS } from "@/lib/content";
const ROLES = ["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"] as const;
const fields = { title: z.string().min(3).max(140), category: z.enum(ARTICLE_CATS), excerpt: z.string().max(300).default(""), body: z.string().min(20).max(30000), coverUrl: z.string().url().nullable().optional(), author: z.string().max(80).optional() };

export async function POST(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ ...fields, publish: z.boolean().default(false) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Check the title, category and story text (at least 20 characters)." }, { status: 400 });
  const { publish, coverUrl, author, ...rest } = p.data;
  const slug = await uniqueSlug(rest.title, async s => !!(await db.article.findUnique({ where: { slug: s }, select: { id: true } })));
  const row = await db.article.create({ data: { ...rest, slug, coverUrl: coverUrl ?? null, ...(author ? { author } : {}), publishedAt: publish ? new Date() : null } });
  await db.auditLog.create({ data: { actor: u.id, action: "article.create", detail: { id: row.id } } });
  refreshSite(); return NextResponse.json(row, { status: 201 });
}

export async function PATCH(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ id: z.string(), ...fields, publish: z.boolean().optional() }).partial({ title: true, category: true, excerpt: true, body: true }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Check the fields and try again." }, { status: 400 });
  const { id, publish, coverUrl, ...rest } = p.data;
  const cur = await db.article.findUnique({ where: { id }, select: { publishedAt: true } });
  if (!cur) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.article.update({ where: { id }, data: { ...rest, ...(coverUrl !== undefined ? { coverUrl } : {}), ...(publish === undefined ? {} : { publishedAt: publish ? cur.publishedAt ?? new Date() : null }) } });
  await db.auditLog.create({ data: { actor: u.id, action: "article.update", detail: { id, publish } } });
  refreshSite(); return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  await db.$transaction([db.comment.deleteMany({ where: { articleId: id } }), db.article.deleteMany({ where: { id } })]);
  await db.auditLog.create({ data: { actor: u.id, action: "article.delete", detail: { id } } });
  refreshSite(); return NextResponse.json({ ok: true });
}
