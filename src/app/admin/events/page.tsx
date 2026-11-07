import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { countyOf } from "@/lib/kenya";
import { readFeatured } from "@/lib/featured";
import EventsManager, { type EventRow } from "@/components/EventsManager";
export const metadata = { title: "Events", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Events() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"]))) redirect("/admin");
  const [trips, seatGroups, pinned] = await Promise.all([
    db.trip.findMany({
      orderBy: { departsAt: "desc" }, take: 300,
      select: { id: true, slug: true, title: true, category: true, tripType: true, durationLabel: true, summary: true, imageUrl: true, departsAt: true, meetingPoint: true, priceKes: true, published: true, isSample: true, destination: { select: { name: true, region: true } }, _count: { select: { bookings: true } } },
    }),
    db.tripSeat.groupBy({ by: ["tripId", "status"], _count: true }),
    readFeatured(),
  ]);
  const seats = new Map<string, { booked: number; total: number }>();
  seatGroups.forEach(g => { const e = seats.get(g.tripId) ?? { booked: 0, total: 0 }; e.total += g._count; if (g.status === "BOOKED") e.booked += g._count; seats.set(g.tripId, e); });
  const rows: EventRow[] = trips.map(t => ({
    id: t.id, slug: t.slug, title: t.title, category: t.category, tripType: t.tripType, durationLabel: t.durationLabel, summary: t.summary, imageUrl: t.imageUrl,
    departsAt: t.departsAt.toISOString(), meetingPoint: t.meetingPoint, priceKes: t.priceKes, published: t.published,
    placeholder: t.isSample || /sample/i.test(t.summary), destination: t.destination.name, ...countyOf(t.destination.region, t.destination.name),
    booked: seats.get(t.id)?.booked ?? 0, seats: seats.get(t.id)?.total ?? 0, bookings: t._count.bookings, pinned: pinned.includes(t.id),
  }));
  return (
    <main className="adm-page">
      <header className="adm-head">
        <div><p className="eyebrow">Content</p><h1>Events <span className="red">&amp; trips</span></h1><p className="mut" style={{ margin: 0 }}>Every event on one screen. Tick the ones you want live and publish them together. Pin up to 6 to put them first on the homepage.</p></div>
        <div className="adm-tools"><Link className="btn sm" href="/admin/events/new">+ New event</Link></div>
      </header>
      <EventsManager rows={rows} />
    </main>
  );
}
