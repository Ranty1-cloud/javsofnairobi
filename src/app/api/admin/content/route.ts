import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
const b = z.discriminatedUnion("type", [
  z.object({ type: z.literal("article"), slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string(), category: z.string(), excerpt: z.string().default(""), body: z.string(), coverUrl: z.string().url().optional(), publishedAt: z.coerce.date().optional() }),
  z.object({ type: z.literal("nganya"), name: z.string(), crew: z.string().optional(), bio: z.string(), imageUrl: z.string().url().optional() }),
  z.object({ type: z.literal("gallery"), url: z.string().url(), caption: z.string().default(""), category: z.string() }),
  z.object({ type: z.literal("destination"), slug: z.string().regex(/^[a-z0-9-]+$/), name: z.string(), description: z.string(), lat: z.number().optional(), lng: z.number().optional() }),
]);
export async function POST(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input", issues: p.error.issues }, { status: 400 });
  const d = p.data;
  const row = d.type === "article" ? await db.article.create({ data: { ...d, type: undefined } as never })
    : d.type === "nganya" ? await db.nganyaProfile.create({ data: { ...d, type: undefined } as never })
    : d.type === "gallery" ? await db.galleryMedia.create({ data: { ...d, type: undefined } as never })
    : await db.destination.create({ data: { ...d, type: undefined } as never });
  await db.auditLog.create({ data: { actor: u.id, action: `content.${d.type}.create` } });
  return NextResponse.json(row, { status: 201 });
}
