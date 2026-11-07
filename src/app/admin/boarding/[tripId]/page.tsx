import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";
import AutoRefresh from "@/components/AutoRefresh";
import BoardingList from "@/components/BoardingList";
export const metadata = { title: "Boarding list", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function BoardingTrip({ params }: { params: { tripId: string } }) {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT"]))) redirect("/admin");
  const trip = await db.trip.findUnique({ where: { id: params.tripId }, select: { id: true, title: true, departsAt: true, meetingPoint: true } });
  if (!trip) notFound();
  const tickets = await db.ticket.findMany({ where: { booking: { tripId: trip.id, status: "CONFIRMED" } }, include: { seat: { select: { label: true, tripVehicle: { select: { name: true } } } }, booking: { select: { reference: true, phone: true } } }, orderBy: { createdAt: "asc" } });
  const rows = tickets.map(t => ({ id: t.id, seat: t.seat.label, vehicle: t.seat.tripVehicle?.name ?? "", name: t.passengerName, ref: t.booking.reference, phone: t.booking.phone, at: t.checkedInAt?.toISOString() ?? null }))
    .sort((a, b) => a.vehicle.localeCompare(b.vehicle) || a.seat.localeCompare(b.seat, undefined, { numeric: true }));
  const boarded = rows.filter(r => r.at).length, pct = rows.length ? Math.round((boarded / rows.length) * 100) : 0;
  const near = Math.abs(trip.departsAt.getTime() - Date.now()) < 12 * 3_600_000;
  return (
    <main className="adm-page">
      <AutoRefresh active={near} />
      <header className="adm-head"><div><p className="eyebrow"><Link href="/admin/boarding">← All trips</Link></p><h1>{trip.title}</h1><p className="mut" style={{ margin: 0 }}>{fmtDateTime(trip.departsAt)} · {trip.meetingPoint}</p></div><Link className="btn sm" href="/admin/scan">Open scanner</Link></header>
      <section className="kpi-grid"><div className="kpi"><small>Boarded</small><b>{boarded} of {rows.length}</b><div className="kpi-foot"><span>{rows.length - boarded} still to arrive</span></div><div className="meter" style={{ marginTop: 4 }}><div className="m-fill" style={{ width: `${pct}%` }} /></div></div></section>
      <section className="panel"><BoardingList rows={rows} /></section>
    </main>
  );
}
