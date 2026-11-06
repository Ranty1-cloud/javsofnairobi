import { db } from "./db";

// Everything here is read from the live database. Nothing is estimated or generated.
// Days are bucketed in Nairobi time (UTC+3, no daylight saving) so "today" matches what staff see on their phones.
const DAY = 86_400_000, EAT = 3 * 3_600_000;
const dayKey = (d: Date) => new Date(d.getTime() + EAT).toISOString().slice(0, 10);

export const RANGES = [7, 30, 90] as const;
export const parseRange = (v: string | string[] | undefined): number => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return (RANGES as readonly number[]).includes(n) ? n : 30;
};
export const PROVIDER_LABEL: Record<string, string> = { mpesa: "M-Pesa STK push", mpesa_stk: "M-Pesa STK push", mpesa_manual: "M-Pesa Paybill (manual)", mpesa_c2b: "M-Pesa Paybill (auto)" };
export const providerLabel = (p: string) => PROVIDER_LABEL[p] ?? p;

export type Point = { label: string; value: number };
export type Delta = { now: number; prev: number };

export async function dashboardStats(days: number) {
  const now = new Date();
  const keys = Array.from({ length: days }, (_, i) => dayKey(new Date(now.getTime() - (days - 1 - i) * DAY)));
  const since = new Date(`${keys[0]}T00:00:00+03:00`);
  const prevSince = new Date(since.getTime() - days * DAY);
  const inRange = (d: Date) => d >= since;

  const [pays, books, users, seatGroups, upcoming, pendingManual, subscribers, pendingSubs, pendingComments, pendingReviews, refunds, articles, repeat] = await Promise.all([
    db.payment.findMany({ where: { status: "SUCCESS", createdAt: { gte: prevSince } }, select: { amountKes: true, provider: true, createdAt: true } }),
    db.booking.findMany({ where: { createdAt: { gte: prevSince } }, select: { status: true, totalKes: true, createdAt: true, tripId: true, trip: { select: { title: true, destination: { select: { name: true } } } } } }),
    db.user.findMany({ where: { createdAt: { gte: prevSince }, deletedAt: null }, select: { createdAt: true } }),
    db.tripSeat.groupBy({ by: ["tripId", "status"], where: { trip: { published: true, departsAt: { gt: now } } }, _count: true }),
    db.trip.findMany({ where: { published: true, departsAt: { gt: now } }, orderBy: { departsAt: "asc" }, take: 8, select: { id: true, title: true, slug: true, departsAt: true } }),
    db.payment.count({ where: { provider: "mpesa_manual", status: "PENDING", booking: { status: "PENDING" } } }),
    db.subscriber.count(),
    db.submission.count({ where: { status: "PENDING" } }),
    db.comment.count({ where: { approved: false } }),
    db.review.count({ where: { approved: false } }),
    db.refund.aggregate({ _sum: { amountKes: true }, _count: true, where: { createdAt: { gte: since } } }),
    db.article.findMany({ where: { archivedAt: null, publishedAt: { not: null } }, orderBy: { comments: { _count: "desc" } }, take: 5, select: { title: true, category: true, _count: { select: { comments: true } } } }),
    db.booking.groupBy({ by: ["userId", "guestEmail"], where: { status: "CONFIRMED" }, _count: true }),
  ]);

  const series = (rows: { createdAt: Date; v: number }[]): Point[] => {
    const m = new Map(keys.map(k => [k, 0]));
    rows.filter(r => inRange(r.createdAt)).forEach(r => m.set(dayKey(r.createdAt), (m.get(dayKey(r.createdAt)) ?? 0) + r.v));
    return keys.map(k => ({ label: k, value: m.get(k) ?? 0 }));
  };
  const split = <T extends { createdAt: Date }>(rows: T[], f: (r: T) => number): Delta => ({
    now: rows.filter(r => inRange(r.createdAt)).reduce((a, r) => a + f(r), 0),
    prev: rows.filter(r => !inRange(r.createdAt)).reduce((a, r) => a + f(r), 0),
  });

  const confirmed = books.filter(b => b.status === "CONFIRMED");
  const curBooks = books.filter(b => inRange(b.createdAt));
  const lost = curBooks.filter(b => b.status === "CANCELLED" || b.status === "EXPIRED").length;

  const statusCounts: Record<string, number> = {};
  curBooks.forEach(b => { statusCounts[b.status] = (statusCounts[b.status] ?? 0) + 1; });

  const methods = new Map<string, { count: number; amount: number }>();
  pays.filter(p => inRange(p.createdAt)).forEach(p => { const m = methods.get(p.provider) ?? { count: 0, amount: 0 }; m.count++; m.amount += p.amountKes; methods.set(p.provider, m); });

  const group = (key: (b: (typeof confirmed)[number]) => string) => {
    const m = new Map<string, { count: number; revenue: number }>();
    confirmed.filter(b => inRange(b.createdAt)).forEach(b => { const k = key(b); const e = m.get(k) ?? { count: 0, revenue: 0 }; e.count++; e.revenue += b.totalKes; m.set(k, e); });
    return [...m.entries()].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  };

  const seatsBy = new Map<string, { BOOKED: number; RESERVED: number; AVAILABLE: number }>();
  seatGroups.forEach(g => { const e = seatsBy.get(g.tripId) ?? { BOOKED: 0, RESERVED: 0, AVAILABLE: 0 }; e[g.status] = g._count; seatsBy.set(g.tripId, e); });
  const occupancy = upcoming.map(t => {
    const s = seatsBy.get(t.id) ?? { BOOKED: 0, RESERVED: 0, AVAILABLE: 0 };
    const total = s.BOOKED + s.RESERVED + s.AVAILABLE;
    return { ...t, booked: s.BOOKED, held: s.RESERVED, total, pct: total ? Math.round((s.BOOKED / total) * 100) : 0 };
  });
  const seatTotals = [...seatsBy.values()].reduce((a, s) => ({ booked: a.booked + s.BOOKED, total: a.total + s.BOOKED + s.RESERVED + s.AVAILABLE }), { booked: 0, total: 0 });

  const buyers = repeat.filter(r => r.userId || r.guestEmail);

  return {
    days, since,
    revenue: split(pays, p => p.amountKes),
    bookings: split(confirmed, () => 1),
    customers: split(users, () => 1),
    created: curBooks.length,
    conversion: curBooks.length ? Math.round((confirmed.filter(b => inRange(b.createdAt)).length / curBooks.length) * 100) : 0,
    lostRate: curBooks.length ? Math.round((lost / curBooks.length) * 100) : 0,
    revenueSeries: series(pays.map(p => ({ createdAt: p.createdAt, v: p.amountKes }))),
    bookingSeries: series(confirmed.map(b => ({ createdAt: b.createdAt, v: 1 }))),
    customerSeries: series(users.map(u => ({ createdAt: u.createdAt, v: 1 }))),
    statusCounts,
    methods: [...methods.entries()].map(([provider, v]) => ({ provider, ...v })).sort((a, b) => b.amount - a.amount),
    topTrips: group(b => b.trip.title),
    topDestinations: group(b => b.trip.destination.name),
    occupancy,
    occupancyPct: seatTotals.total ? Math.round((seatTotals.booked / seatTotals.total) * 100) : null,
    seatTotals,
    queue: { pendingManual, pendingSubs, pendingComments, pendingReviews },
    refunds: { count: refunds._count, amount: refunds._sum.amountKes ?? 0 },
    subscribers,
    articles: articles.map(a => ({ title: a.title, category: a.category, comments: a._count.comments })),
    returning: { buyers: buyers.length, repeat: buyers.filter(b => b._count > 1).length },
  };
}
export type DashboardStats = Awaited<ReturnType<typeof dashboardStats>>;
