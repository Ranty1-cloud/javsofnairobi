import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX = 4 * 1024 * 1024; // Vercel functions accept request bodies up to about 4.5 MB

export async function POST(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG or WebP image" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 400 });
  const bucket = process.env.SUPABASE_BUCKET;
  if (!bucket) return NextResponse.json({ error: "SUPABASE_BUCKET is not set" }, { status: 500 });
  const sb = supabaseAdmin();
  const path = `site/hero-${Date.now()}.${ext}`;
  const up = await sb.storage.from(bucket).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (up.error) { console.error("hero upload failed", up.error.message); return NextResponse.json({ error: "Upload failed" }, { status: 500 }); }
  const url = sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  await db.siteSetting.upsert({ where: { key: "heroImage" }, update: { value: url }, create: { key: "heroImage", value: url } });
  await db.auditLog.create({ data: { actor: u.id, action: "site.hero.update" } });
  return NextResponse.json({ url });
}

export async function DELETE() {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await db.siteSetting.deleteMany({ where: { key: "heroImage" } });
  await db.auditLog.create({ data: { actor: u.id, action: "site.hero.reset" } });
  return NextResponse.json({ ok: true });
}
