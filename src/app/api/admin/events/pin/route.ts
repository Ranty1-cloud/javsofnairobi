import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { FEATURED_MAX, readFeatured, saveFeatured } from "@/lib/featured";
import { refreshSite } from "@/lib/refresh";

// Pin an event to the top of the homepage (the first pinned upcoming event also becomes the big "Next adventure" card).
export async function POST(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ id: z.string().min(5).max(40), pinned: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const list = (await readFeatured()).filter(x => x !== p.data.id);
  if (p.data.pinned) {
    const t = await db.trip.findUnique({ where: { id: p.data.id }, select: { published: true } });
    if (!t) return NextResponse.json({ error: "No such event" }, { status: 404 });
    if (!t.published) return NextResponse.json({ error: "Publish the event first, then pin it" }, { status: 400 });
    if (list.length >= FEATURED_MAX) return NextResponse.json({ error: `You can pin up to ${FEATURED_MAX} events. Unpin one first.` }, { status: 400 });
    list.push(p.data.id);
  }
  await saveFeatured(list);
  await db.auditLog.create({ data: { actor: u.id, action: p.data.pinned ? "trip.pin" : "trip.unpin", detail: { id: p.data.id } } });
  refreshSite(); return NextResponse.json({ ok: true, featured: list });
}
