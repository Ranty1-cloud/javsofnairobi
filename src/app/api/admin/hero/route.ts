import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { HERO_MAX, HERO_PATH, ROLES_HERO, readHero, saveLibrary, setActive } from "@/lib/hero";
import { refreshSite } from "@/lib/refresh";

const deny = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

// Step 2 of an upload: register a file the browser already put in Storage and make it the live homepage photo.
// The URL is rebuilt here from the path; a client-supplied URL is never trusted.
export async function POST(req: Request) {
  const u = await requireRole([...ROLES_HERO]);
  if (!u) return deny();
  const p = z.object({ path: z.string().regex(HERO_PATH) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  const bucket = process.env.SUPABASE_BUCKET;
  if (!bucket) return NextResponse.json({ error: "SUPABASE_BUCKET is not set" }, { status: 500 });
  const sb = supabaseAdmin(), name = p.data.path.split("/")[1];
  const found = await sb.storage.from(bucket).list("site", { search: name, limit: 5 });
  if (found.error || !found.data?.some(f => f.name === name)) return NextResponse.json({ error: "Upload not found, try again" }, { status: 400 });
  const url = sb.storage.from(bucket).getPublicUrl(p.data.path).data.publicUrl;
  const { library } = await readHero();
  if (!library.some(i => i.path === p.data.path)) {
    library.unshift({ url, path: p.data.path });
    const dropped = library.splice(HERO_MAX); // keep the library bounded and clean up what falls off the end
    if (dropped.length) await sb.storage.from(bucket).remove(dropped.map(d => d.path).filter(Boolean));
  }
  await saveLibrary(library);
  await setActive(url);
  await db.auditLog.create({ data: { actor: u.id, action: "site.hero.update", detail: { path: p.data.path } } });
  refreshSite(); return NextResponse.json({ url, library });
}

// Switch the live photo to one already in the library.
export async function PATCH(req: Request) {
  const u = await requireRole([...ROLES_HERO]);
  if (!u) return deny();
  const p = z.object({ url: z.string().url() }).safeParse(await req.json().catch(() => null));
  const { library, active } = await readHero();
  if (!p.success || !(library.some(i => i.url === p.data.url) || active === p.data.url)) return NextResponse.json({ error: "Photo not in the library" }, { status: 400 });
  await setActive(p.data.url);
  await db.auditLog.create({ data: { actor: u.id, action: "site.hero.update", detail: { url: p.data.url } } });
  refreshSite(); return NextResponse.json({ url: p.data.url });
}

// ?url=...  removes one photo from the library (and Storage). No url: go back to the automatic photo.
export async function DELETE(req: Request) {
  const u = await requireRole([...ROLES_HERO]);
  if (!u) return deny();
  const url = new URL(req.url).searchParams.get("url");
  const { library, active } = await readHero();
  if (!url) {
    await db.siteSetting.deleteMany({ where: { key: "heroImage" } });
    await db.auditLog.create({ data: { actor: u.id, action: "site.hero.reset" } });
    refreshSite(); return NextResponse.json({ ok: true, library });
  }
  const item = library.find(i => i.url === url);
  if (!item && active !== url) return NextResponse.json({ error: "Photo not in the library" }, { status: 400 });
  const next = library.filter(i => i.url !== url);
  await saveLibrary(next);
  if (active === url) await db.siteSetting.deleteMany({ where: { key: "heroImage" } });
  const bucket = process.env.SUPABASE_BUCKET;
  if (item?.path && bucket) await supabaseAdmin().storage.from(bucket).remove([item.path]);
  await db.auditLog.create({ data: { actor: u.id, action: "site.hero.delete", detail: { path: item?.path ?? null } } });
  refreshSite(); return NextResponse.json({ ok: true, library: next, reset: active === url });
}
