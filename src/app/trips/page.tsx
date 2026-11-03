import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import TripCard from "@/components/TripCard";
import { toCard, tripInclude } from "@/lib/queries";
export const dynamic = "force-dynamic";
export const metadata = { title: "Trips & Adventures", description: "Upcoming Kenyan road trips, resort escapes, Nganya events and cultural experiences from Nairobi." };
type SP = { q?: string; type?: string; cat?: string; dest?: string; max?: string; avail?: string; sort?: string };
const CATS = ["Road trip", "Nganya", "Resort", "Cultural"];
export default async function Trips({ searchParams: sp }: { searchParams: SP }) {
  const where: Prisma.TripWhereInput = { published: true, departsAt: { gt: new Date() } };
  if (sp.q) where.OR = [{ title: { contains: sp.q, mode: "insensitive" } }, { destination: { name: { contains: sp.q, mode: "insensitive" } } }, { category: { contains: sp.q, mode: "insensitive" } }];
  if (sp.type && ["DAY", "OVERNIGHT", "WEEKEND"].includes(sp.type)) where.tripType = sp.type;
  if (sp.cat) where.category = { contains: sp.cat, mode: "insensitive" };
  if (sp.dest) where.destination = { slug: sp.dest };
  if (sp.max && Number(sp.max) > 0) where.priceKes = { lte: Math.floor(Number(sp.max)) };
  if (sp.avail === "1") where.seats = { some: { status: "AVAILABLE" } };
  const orderBy: Prisma.TripOrderByWithRelationInput = sp.sort === "price-asc" ? { priceKes: "asc" } : sp.sort === "price-desc" ? { priceKes: "desc" } : { departsAt: "asc" };
  const [trips, dests] = await Promise.all([db.trip.findMany({ where, orderBy, take: 36, include: tripInclude }), db.destination.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } })]);
  return (
    <div className="wrap">
      <p className="eyebrow">Upcoming</p><h1 className="disp" style={{ fontSize: "clamp(2.8rem,7vw,5rem)" }}>Trips &amp; <span className="red">Adventures</span></h1>
      <div className="chips" aria-label="Quick filters">{[["All", "/trips"], ["Weekend", "/trips?type=WEEKEND"], ["Day trips", "/trips?type=DAY"], ["Overnight", "/trips?type=OVERNIGHT"], ...CATS.map(c => [c, `/trips?cat=${encodeURIComponent(c)}`])].map(([n, h]) => <a key={h} href={h} className="chip">{n}</a>)}</div>
      <form className="filters" method="get" role="search">
        <label>Search<input name="q" defaultValue={sp.q} placeholder="Trip, place or category" /></label>
        <label>Type<select name="type" defaultValue={sp.type ?? ""}><option value="">Any</option><option value="DAY">Day trip</option><option value="WEEKEND">Weekend</option><option value="OVERNIGHT">Overnight</option></select></label>
        <label>Destination<select name="dest" defaultValue={sp.dest ?? ""}><option value="">Anywhere</option>{dests.map(d => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select></label>
        <label>Max price (KSh)<input name="max" type="number" min="0" step="100" defaultValue={sp.max} /></label>
        <label>Sort<select name="sort" defaultValue={sp.sort ?? "date"}><option value="date">Soonest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
        <button className="btn">Apply</button>
        <label style={{ gridColumn: "1/-1" }}><input type="checkbox" name="avail" value="1" defaultChecked={sp.avail === "1"} />Only trips with seats available</label>
      </form>
      <div className="grid">{trips.map(t => <TripCard key={t.id} t={toCard(t)} />)}{!trips.length && <div className="empty">No trips match those filters. <a className="red" href="/trips">Clear filters</a></div>}</div>
    </div>
  );
}
