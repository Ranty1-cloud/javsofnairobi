import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { dashboardStats, parseRange, providerLabel, RANGES } from "@/lib/admin-stats";
import { ksh } from "@/lib/format";
import { AreaChart, Columns, Delta, Donut, HBars } from "@/components/charts";
export const metadata = { title: "Analytics", robots: { index: false } };
export const dynamic = "force-dynamic";
const STATUS_COLOR: Record<string, string> = { CONFIRMED: "#E50914", PENDING: "#d9a400", CANCELLED: "#8a8a8a", EXPIRED: "#444", REFUNDED: "#F3F3F3" };

export default async function Analytics({ searchParams }: { searchParams: { range?: string } }) {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER", "BOOKING_MANAGER"]))) redirect("/");
  const days = parseRange(searchParams.range), s = await dashboardStats(days);
  const slices = ["CONFIRMED", "PENDING", "CANCELLED", "EXPIRED", "REFUNDED"].map(k => ({ label: k[0] + k.slice(1).toLowerCase(), value: s.statusCounts[k] ?? 0, color: STATUS_COLOR[k] }));
  const avg = s.bookings.now ? Math.round(s.revenue.now / s.bookings.now) : 0;
  const repeatPct = s.returning.buyers ? Math.round((s.returning.repeat / s.returning.buyers) * 100) : 0;
  return (
    <main className="adm-page">
      <header className="adm-head">
        <div><p className="eyebrow">Reports</p><h1>Analytics</h1><p className="mut" style={{ margin: 0 }}>Straight from the database. Last {days} days compared with the {days} before.</p></div>
        <div className="adm-tools">
          <div className="pills" role="group" aria-label="Date range">{RANGES.map(r => <Link key={r} href={`/admin/analytics?range=${r}`} className={r === days ? "on" : ""} aria-current={r === days ? "true" : undefined}>{r}d</Link>)}</div>
          <a className="btn sm ghost" href="/api/admin/export?type=bookings">Bookings CSV</a>
          <a className="btn sm ghost" href="/api/admin/export?type=payments">Payments CSV</a>
        </div>
      </header>

      <section className="kpi-grid" aria-label="Key numbers">
        <div className="kpi"><small>Revenue</small><b>{ksh(s.revenue.now)}</b><div className="kpi-foot"><Delta {...s.revenue} /></div></div>
        <div className="kpi"><small>Confirmed bookings</small><b>{s.bookings.now}</b><div className="kpi-foot"><Delta {...s.bookings} /></div></div>
        <div className="kpi"><small>Average per booking</small><b>{s.bookings.now ? ksh(avg) : "n/a"}</b><div className="kpi-foot"><span>Revenue ÷ confirmed bookings</span></div></div>
        <div className="kpi"><small>Booking conversion</small><b>{s.created ? `${s.conversion}%` : "n/a"}</b><div className="kpi-foot"><span>{s.created} started</span></div></div>
        <div className="kpi"><small>Cancelled or expired</small><b>{s.created ? `${s.lostRate}%` : "n/a"}</b><div className="kpi-foot"><span>Lower is better</span></div></div>
        <div className="kpi"><small>Returning customers</small><b>{s.returning.buyers ? `${repeatPct}%` : "n/a"}</b><div className="kpi-foot"><span>{s.returning.repeat} of {s.returning.buyers} buyers, all time</span></div></div>
      </section>

      <section className="panel"><div className="panel-head"><h2>Revenue</h2><span className="mut">Confirmed payments per day</span></div><AreaChart data={s.revenueSeries} fmt={ksh} label="Daily revenue from confirmed payments" /></section>

      <div className="adm-grid g-1-1">
        <section className="panel"><div className="panel-head"><h2>Bookings per day</h2></div><Columns data={s.bookingSeries} label="Confirmed bookings per day" /></section>
        <section className="panel"><div className="panel-head"><h2>New customers</h2><span className="mut">Account sign-ups · {s.customers.now}</span></div><Columns data={s.customerSeries} label="New accounts per day" color="#F3F3F3" /></section>
      </div>

      <div className="adm-grid g-1-1">
        <section className="panel"><div className="panel-head"><h2>Payment methods</h2></div>
          <HBars items={s.methods.map(m => ({ label: providerLabel(m.provider), value: m.amount, note: `${m.count} payment${m.count === 1 ? "" : "s"}` }))} fmt={ksh} empty="No confirmed payments in this period yet." />
        </section>
        <section className="panel"><div className="panel-head"><h2>Booking outcomes</h2></div><Donut slices={slices} center={String(s.created)} sub="bookings started" /></section>
      </div>

      <div className="adm-grid g-1-1">
        <section className="panel"><div className="panel-head"><h2>Revenue per trip</h2></div>
          {s.topTrips.length ? <table className="tbl"><thead><tr><th>Trip</th><th>Bookings</th><th>Revenue</th></tr></thead><tbody>{s.topTrips.map(t => <tr key={t.label}><td>{t.label}</td><td>{t.count}</td><td>{ksh(t.revenue)}</td></tr>)}</tbody></table> : <p className="mut">No confirmed bookings in this period yet.</p>}
        </section>
        <section className="panel"><div className="panel-head"><h2>Popular destinations</h2></div>
          <HBars items={s.topDestinations.map(d => ({ label: d.label, value: d.count }))} fmt={n => `${n} booking${n === 1 ? "" : "s"}`} empty="Destinations appear once bookings are confirmed." />
        </section>
      </div>

      <div className="adm-grid g-1-1">
        <section className="panel"><div className="panel-head"><h2>News engagement</h2><span className="mut">Most-discussed stories</span></div>
          <HBars items={s.articles.filter(a => a.comments > 0).map(a => ({ label: a.title, value: a.comments, note: a.category }))} fmt={n => `${n} comment${n === 1 ? "" : "s"}`} empty="No comments on published stories yet." />
        </section>
        <section className="panel"><div className="panel-head"><h2>Community</h2></div>
          <div className="mini-stats"><div><b>{s.subscribers}</b><span>Newsletter subscribers</span></div><div><b>{s.refunds.count}</b><span>Refunds in period ({ksh(s.refunds.amount)})</span></div></div>
        </section>
      </div>
    </main>
  );
}
