import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, STAFF } from "@/lib/session";
export const dynamic = "force-dynamic";
const card = { background: "#111", border: "1px solid #292929", borderRadius: 14, padding: 20 } as const;
export default async function Admin() {
  const me = await requireRole(STAFF);
  if (!me) redirect("/");
  const [rev, bookings, upcoming, seats, booked, recent] = await Promise.all([
    db.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amountKes: true } }),
    db.booking.count({ where: { status: "CONFIRMED" } }),
    db.trip.count({ where: { departsAt: { gt: new Date() }, published: true } }),
    db.tripSeat.count({ where: { trip: { departsAt: { gt: new Date() } } } }),
    db.tripSeat.count({ where: { status: "BOOKED", trip: { departsAt: { gt: new Date() } } } }),
    db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { booking: true } }),
  ]);
  const stats: [string, string][] = [["Revenue (confirmed)", `KSh ${(rev._sum.amountKes ?? 0).toLocaleString()}`], ["Confirmed bookings", String(bookings)], ["Upcoming trips", String(upcoming)], ["Occupancy", seats ? `${Math.round((booked / seats) * 100)}%` : "n/a"]];
  return (
    <main style={{ padding: "6vh 8vw" }}>
      <h1>Admin <span style={{ color: "#E50914" }}>Dashboard</span></h1>
      <p style={{ color: "#A1A1A1" }}>Signed in as {me.name} ({me.role})</p>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        {stats.map(([k, v]) => <div key={k} style={card}><small style={{ color: "#A1A1A1" }}>{k}</small><h2 style={{ margin: "8px 0 0" }}>{v}</h2></div>)}
      </div>
      <h3 style={{ marginTop: 32 }}>Recent payments</h3>
      {recent.length === 0 ? <p style={{ color: "#A1A1A1" }}>No payments yet.</p> : recent.map(p => <p key={p.id}>{p.booking.reference} · {p.provider} · KSh {p.amountKes.toLocaleString()} · {p.status}</p>)}
    </main>
  );
}
