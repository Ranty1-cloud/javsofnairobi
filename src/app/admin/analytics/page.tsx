import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
export const dynamic = "force-dynamic";
export default async function Analytics() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER", "BOOKING_MANAGER"]))) redirect("/");
  const [pays, trips, byStatus] = await Promise.all([
    db.payment.findMany({ where: { status: "SUCCESS" }, select: { amountKes: true, provider: true, createdAt: true } }),
    db.trip.findMany({ include: { bookings: { where: { status: "CONFIRMED" }, select: { totalKes: true } }, _count: { select: { seats: true } } } }),
    db.booking.groupBy({ by: ["status"], _count: true }),
  ]);
  const monthly: Record<string, number> = {}, methods: Record<string, number> = {};
  pays.forEach(p => { const k = p.createdAt.toISOString().slice(0, 7); monthly[k] = (monthly[k] ?? 0) + p.amountKes; methods[p.provider] = (methods[p.provider] ?? 0) + 1; });
  const total = byStatus.reduce((a, s) => a + s._count, 0), lost = byStatus.filter(s => ["CANCELLED", "EXPIRED"].includes(s.status)).reduce((a, s) => a + s._count, 0);
  return (
    <main className="wrap">
      <h1>Analytics</h1>
      <p><a className="btn" href="/api/admin/export?type=bookings">Export bookings CSV</a> <a className="btn" href="/api/admin/export?type=payments">Export payments CSV</a></p>
      <h3>Monthly revenue</h3>{Object.entries(monthly).sort().map(([k, v]) => <p key={k}>{k}: KSh {v.toLocaleString()}</p>)}{!pays.length && <p className="mut">No confirmed payments yet.</p>}
      <h3>Per trip</h3>{trips.map(t => <p key={t.id}>{t.title}: {t.bookings.length} bookings, KSh {t.bookings.reduce((a, b) => a + b.totalKes, 0).toLocaleString()}</p>)}
      <h3>Payment methods</h3>{Object.entries(methods).map(([k, v]) => <p key={k}>{k}: {v}</p>)}
      <h3>Cancellation / expiry rate</h3><p>{total ? Math.round((lost / total) * 100) : 0}% of {total} bookings</p>
    </main>
  );
}
