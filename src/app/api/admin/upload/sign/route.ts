import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { HERO_EXT } from "@/lib/hero";

// Signed upload for admin forms (trip, article, destination, Nganya, gallery images).
// The browser sends the file straight to Supabase Storage with the one-time token, then stores the returned public URL in the form.
const MAX = 10 * 1024 * 1024;
const FOLDERS = ["trips", "articles", "destinations", "nganya", "gallery"] as const;
export async function POST(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR", "BOOKING_MANAGER"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ folder: z.enum(FOLDERS), contentType: z.string(), size: z.number().int().positive() }).safeParse(await req.json().catch(() => null));
  const ext = p.success ? HERO_EXT[p.data.contentType] : undefined;
  if (!p.success || !ext) return NextResponse.json({ error: "Use a JPG, PNG or WebP image" }, { status: 400 });
  if (p.data.size > MAX) return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
  const bucket = process.env.SUPABASE_BUCKET;
  if (!bucket) return NextResponse.json({ error: "SUPABASE_BUCKET is not set" }, { status: 500 });
  const path = `${p.data.folder}/img-${Date.now()}-${Math.random().toString(36).slice(2, 8).padEnd(4, "0")}.${ext}`;
  const sb = supabaseAdmin();
  const { data, error } = await sb.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) { console.error("upload sign failed", error?.message); return NextResponse.json({ error: "Could not start the upload" }, { status: 500 }); }
  return NextResponse.json({ bucket, path: data.path, token: data.token, url: sb.storage.from(bucket).getPublicUrl(path).data.publicUrl });
}
