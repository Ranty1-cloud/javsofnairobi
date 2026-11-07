import Link from "next/link";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, STAFF } from "@/lib/session";
import { dashboardStats, parseRange, providerLabel, RANGES } from "@/lib/admin-stats";
import { fmtDateTime, ksh } from "@/lib/format";
import { AreaChart, Columns, Delta, Donut, HBars, Meter, Spark } from "@/components/charts";
export const metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

const MONEY: Role[] = ["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER"];
const STATUS_COLOR: Record<string, string> = { CONFIRMED: "#E50914", PENDING: "#d9a400", CANCELLED: "#8a8a8a", EXPIRED: "#444", REFUNDED: "#F3F3F3" };
const ROLE_LABEL: Record<string, string> = { SUPER_ADMIN: "Super Admin", ADMIN: "Administrator", BOOKING_MANAGER: "Booking Manager", CONTENT_EDITOR: "Content Editor", FINANCE_MANAGER: "Finance Manager", SUPPORT: "Customer Support" };

function Kpi({ label, value, sub, spark, sparkLabel }: { label: string; value: string; sub: React.ReactNode; spark?: number[]; sparkLabel?: string }) {
  return <div className="kpi"><small>{label}</small><b>{value}</b><div className="kpi-foot"><span>{sub}</span>{spark && <Spark values={spark} label={sparkLabel ?? label} />}</div></div>;
}

export default async function Admin({ searchParams }: { searchParams: { range?: string } }) {
  const me = await requireRole(STAFF);
  if (!me) redirect("/");
  const money = MONEY.includes(me.role), days = parseRange(searchParams.range);
  const [s, hero, recent] = await Promise.all([
    dashboardStats(days),
    db.siteSetting.findUnique({ where: { key: "heroImage" } }),
    money ? db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 7, include: { booking: { select: { reference: true } } } }) : Promise.resolve([]),
  ]);
  const hour = Number(new Date().toLocaleString("en-GB", { timeZone: "Africa/Nairobi", hour: "2-digit", hour12: false }));
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = me.name.split(" ")[0];
  const spark = (v: { value: number }[]) => v.map(x => x.value);
  const queueTotal = s.queue.pendingManual + s.queue.pendingSubs + s.queue.pendingComments + s.queue.pendingReviews;
  const slices = ["CONFIRMED", "PENDING", "CANCELLED", "EXPIRED", "REFUNDED"].map(k => ({ label: k[0] + k.slice(1).toLowerCase(), value: s.statusCounts[k] ?? 0, color: STATUS_COLOR[k] }));
  const queue: [string, number, string][] = [
    ["Manual M-Pesa to verify", s.queue.pendingManual, "/admin/payments"],
    ["Community submissions", s.queue.pendingSubs, "/admin/moderation"],
    ["Comments to approve", s.queue.pendingComments, "/admin/moderation"],
    ["Reviews to approve", s.queue.pendingReviews, "/admin/moderation"],
  ];

  return (
    <main className="adm-page">
      <header className="adm-head">
        <div>
          <p className="eyebrow">{ROLE_LABEL[me.role] ?? me.role}</p>
          <h1>{greet}, <span className="red">{first}</span></h1>
          <p className="mut" style={{ margin: 0 }}>Live numbers from your bookings and payments. Last {days} days compared with the {days} before.</p>
        </div>
        <div className="adm-tools">
          <div className="pills" role="group" aria-label="Date range">{RANGES.map(r => <Link key={r} href={`/admin?range=${r}`} className={r === days ? "on" : ""} aria-current={r === days ? "true" : undefined}>{r}d</Link>)}</div>
          <Link href="/admin/events/new" className="btn sm">+ New event</Link>
        </div>
      </header>

      <section className="kpi-grid" aria-label="Key numbers">
        {money && <Kpi label="Revenue" value={ksh(s.revenue.now)} sub={<Delta {...s.revenue} />} spark={spark(s.revenueSeries)} sparkLabel="Daily revenue" />}
        <Kpi label="Confirmed bookings" value={String(s.bookings.now)} sub={<Delta {...s.bookings} />} spark={spark(s.bookingSeries)} sparkLabel="Daily bookings" />
        <Kpi label="New customers" value={String(s.customers.now)} sub={<Delta {...s.customers} />} spark={spark(s.customerSeries)} sparkLabel="Daily sign-ups" />
        <Kpi label="Seats booked (upcoming)" value={s.occupancyPct === null ? "n/a" : `${s.occupancyPct}%`} sub={s.seatTotals.total ? `${s.seatTotals.booked} of ${s.seatTotals.total} seats` : "No open trips"} />
        <Kpi label="Booking conversion" value={s.created ? `${s.conversion}%` : "n/a"} sub={s.created ? `${s.lostRate}% cancelled or expired` : "No bookings started yet"} />
      </section>

      <div className="adm-grid g-2-1">
        <section className="panel"><div className="panel-head"><h2>{money ? "Revenue" : "Confirmed bookings"}</h2><span className="mut">Per day · Nairobi time</span></div>
          {money ? <AreaChart data={s.revenueSeries} fmt={ksh} label="Daily revenue from confirmed payments" /> : <AreaChart data={s.bookingSeries} label="Daily confirmed bookings" />}
        </section>
        <section className="panel"><div className="panel-head"><h2>Booking outcomes</h2></div><Donut slices={slices} center={String(s.created)} sub="bookings started" /></section>
      </div>

      <div className="adm-grid g-2-1">
        <section className="panel"><div className="panel-head"><h2>Daily bookings</h2><span className="mut">{s.bookings.now} confirmed</span></div><Columns data={s.bookingSeries} label="Confirmed bookings per day" /></section>
        <section className="panel"><div className="panel-head"><h2>Needs attention</h2>{queueTotal > 0 && <span className="badge red">{queueTotal}</span>}</div>
          <ul className="queue">{queue.map(([l, n, href]) => <li key={l}><Link href={href}><span>{l}</span><b className={n ? "hot" : ""}>{n}</b></Link></li>)}</ul>
          {queueTotal === 0 && <p className="mut" style={{ margin: "10px 0 0" }}>Nothing waiting. All clear.</p>}
        </section>
      </div>

      <div className="adm-grid g-1-1">
        <section className="panel"><div className="panel-head"><h2>Upcoming trips · seats</h2><Link href="/admin/events" className="mut">Manage →</Link></div>
          {s.occupancy.length ? <ul className="occ">{s.occupancy.map(t => <li key={t.id}><div className="hb-top"><Link href={`/trips/${t.slug}`} target="_blank" rel="noopener">{t.title}</Link><b>{t.booked}/{t.total}</b></div><Meter pct={t.pct} held={t.total ? Math.round((t.held / t.total) * 100) : 0} label={t.title} /><small className="mut">{fmtDateTime(t.departsAt)}{t.held ? ` · ${t.held} on hold` : ""}</small></li>)}</ul> : <p className="mut">No published upcoming trips. Create one from Trips & content.</p>}
        </section>
        <section className="panel"><div className="panel-head"><h2>Top trips</h2><span className="mut">{money ? "By revenue" : "By bookings"}</span></div>
          <HBars items={s.topTrips.map(t => ({ label: t.label, value: money ? t.revenue : t.count, note: `${t.count} booking${t.count === 1 ? "" : "s"}` }))} fmt={money ? ksh : String} empty="No confirmed bookings in this period yet." />
          <div className="panel-head" style={{ marginTop: 22 }}><h2>Top destinations</h2></div>
          <HBars items={s.topDestinations.slice(0, 4).map(t => ({ label: t.label, value: t.count }))} fmt={n => `${n} booking${n === 1 ? "" : "s"}`} empty="Destinations appear once bookings are confirmed." />
        </section>
      </div>

      <div className="adm-grid g-1-1">
        {money ? (
          <section className="panel"><div className="panel-head"><h2>Recent payments</h2><Link href="/admin/analytics" className="mut">All analytics →</Link></div>
            {recent.length ? <table className="tbl"><thead><tr><th>Booking</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>{recent.map(p => <tr key={p.id}><td>{p.booking.reference}</td><td>{providerLabel(p.provider)}</td><td>{ksh(p.amountKes)}</td><td><span className={`st st-${p.status.toLowerCase()}`}>{p.status}</span></td></tr>)}</tbody></table> : <p className="mut">No payments yet.</p>}
            {s.refunds.count > 0 && <p className="mut" style={{ margin: "12px 0 0" }}>{s.refunds.count} refund{s.refunds.count === 1 ? "" : "s"} recorded in this period, {ksh(s.refunds.amount)}.</p>}
          </section>
        ) : (
          <section className="panel"><div className="panel-head"><h2>Community</h2></div><p className="mut">{s.subscribers} newsletter subscribers.</p></section>
        )}
        <section className="panel hero-card">
          <div className="panel-head"><h2>Homepage photo</h2><Link href="/admin/site" className="mut">Change →</Link></div>
          <Link href="/admin/site" className="hero-thumb" aria-label="Change the homepage photo">{hero?.value ? <img src={hero.value} alt="Current homepage hero" /> : <span>Automatic: next trip or latest gallery photo</span>}<em>Change photo</em></Link>
        </section>
      </div>
    </main>
  );
}
