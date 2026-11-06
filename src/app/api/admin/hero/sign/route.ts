import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { HERO_EXT, ROLES_HERO } from "@/lib/hero";

// Step 1 of a homepage photo upload. The browser sends the file straight to Supabase Storage with the one-time token
// returned here, so photos are not squeezed through the 4.5 MB serverless request limit. Staff only.
const MAX = 10 * 1024 * 1024;
export async function POST(req: Request) {
  const u = await requireRole([...ROLES_HERO]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ contentType: z.string(), size: z.number().int().positive() }).safeParse(await req.json().catch(() => null));
  const ext = p.success ? HERO_EXT[p.data.contentType] : undefined;
  if (!p.success || !ext) return NextResponse.json({ error: "Use a JPG, PNG or WebP image" }, { status: 400 });
  if (p.data.size > MAX) return NextResponse.json({ error: "Image must be under 10 MB" }, { status: 400 });
  const bucket = process.env.SUPABASE_BUCKET;
  if (!bucket) return NextResponse.json({ error: "SUPABASE_BUCKET is not set" }, { status: 500 });
  const path = `site/hero-${Date.now()}-${Math.random().toString(36).slice(2, 8).padEnd(4, "0")}.${ext}`;
  const { data, error } = await supabaseAdmin().storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) { console.error("hero sign failed", error?.message); return NextResponse.json({ error: "Could not start the upload" }, { status: 500 }); }
  return NextResponse.json({ bucket, path: data.path, token: data.token });
}
