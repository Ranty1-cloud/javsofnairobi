import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { GALLERY_CATS } from "@/lib/gallery";
import { refreshSite } from "@/lib/refresh";

const ROLES = ["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"] as const;
const cat = z.enum(GALLERY_CATS);
const deny = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function POST(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return deny();
  const p = z.object({ url: z.string().url().max(600), category: cat, caption: z.string().max(200).default("") }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const row = await db.galleryMedia.create({ data: p.data });
  await db.auditLog.create({ data: { actor: u.id, action: "gallery.create", detail: { id: row.id } } });
  refreshSite(); return NextResponse.json(row, { status: 201 });
}

export async function PATCH(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return deny();
  const p = z.object({ id: z.string().min(5).max(40), caption: z.string().max(200).optional(), category: cat.optional() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { id, ...data } = p.data;
  const r = await db.galleryMedia.updateMany({ where: { id }, data });
  if (!r.count) return NextResponse.json({ error: "No such photo" }, { status: 404 });
  await db.auditLog.create({ data: { actor: u.id, action: "gallery.update", detail: { id } } });
  refreshSite(); return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return deny();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (id.length < 5 || id.length > 40) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const row = await db.galleryMedia.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "No such photo" }, { status: 404 });
  await db.galleryMedia.delete({ where: { id } });
  // Also free the file in Storage when it is one of ours (best effort: the photo is already gone from the site).
  const bucket = process.env.SUPABASE_BUCKET, marker = `/object/public/${bucket}/`, at = row.url.indexOf(marker);
  if (bucket && at >= 0) {
    const path = row.url.slice(at + marker.length);
    if (path.startsWith("gallery/")) await supabaseAdmin().storage.from(bucket).remove([path]).catch(() => undefined);
  }
  await db.auditLog.create({ data: { actor: u.id, action: "gallery.delete", detail: { id } } });
  refreshSite(); return NextResponse.json({ ok: true });
}
