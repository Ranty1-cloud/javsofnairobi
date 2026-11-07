import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { readFeatured, saveFeatured } from "@/lib/featured";
import { refreshSite } from "@/lib/refresh";

const ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"] as const;

// Publish or unpublish one or many events at once. Publishing also clears the "sample" flag: staff chose to show it.
export async function PATCH(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ ids: z.array(z.string().min(5).max(40)).min(1).max(100), published: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data: { published: boolean; isSample?: boolean } = { published: p.data.published };
  if (p.data.published) data.isSample = false;
  const r = await db.trip.updateMany({ where: { id: { in: p.data.ids } }, data });
  if (!p.data.published) { // an unpublished event cannot stay pinned to the homepage
    const keep = (await readFeatured()).filter(id => !p.data.ids.includes(id));
    await saveFeatured(keep);
  }
  await db.auditLog.create({ data: { actor: u.id, action: p.data.published ? "trip.publish" : "trip.unpublish", detail: { ids: p.data.ids, count: r.count } } });
  refreshSite(); return NextResponse.json({ ok: true, count: r.count });
}

// Delete an event that has never had a booking. Anything with bookings must be unpublished instead, so customer records stay intact.
export async function DELETE(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (id.length < 5 || id.length > 40) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const trip = await db.trip.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!trip) return NextResponse.json({ error: "No such event" }, { status: 404 });
  if (await db.booking.count({ where: { tripId: id } })) return NextResponse.json({ error: "This event has bookings, so it cannot be deleted. Unpublish it instead." }, { status: 409 });
  await db.$transaction([db.tripSeat.deleteMany({ where: { tripId: id } }), db.waitlist.deleteMany({ where: { tripId: id } }), db.trip.delete({ where: { id } })]);
  await saveFeatured((await readFeatured()).filter(x => x !== id));
  await db.auditLog.create({ data: { actor: u.id, action: "trip.delete", detail: { id, title: trip.title } } });
  refreshSite(); return NextResponse.json({ ok: true });
}
