import Link from "next/link";
import { db } from "@/lib/db";
import Countdown from "@/components/Countdown";
import TripCard from "@/components/TripCard";
import NewsletterForm from "@/components/NewsletterForm";
import { toCard, upcomingTrips, liveArticles, tripInclude } from "@/lib/queries";
import { readFeatured } from "@/lib/featured";
import { fmtDateTime } from "@/lib/format";
// Cached for 60s and refreshed instantly when an admin saves a change (see lib/refresh.ts). Seat counts are re-checked at booking time.
export const revalidate = 60;
const wa = process.env.NEXT_PUBLIC_WHATSAPP ?? "";
const Head = ({ t, href, more }: { t: string; href?: string; more?: string }) => <div className="sec-head"><h2>{t}</h2>{href && <Link href={href}>{more ?? "View all"} →</Link>}</div>;
export default async function Home() {
  const [trips, news, nganya, dests, gallery, reviews, seatsBooked, tripCount, destCount, storyCount, heroSetting, pinnedIds] = await Promise.all([
    upcomingTrips(6),
    db.article.findMany({ where: liveArticles(), orderBy: { publishedAt: "desc" }, take: 3 }),
    db.nganyaProfile.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    db.destination.findMany({ orderBy: { name: "asc" }, take: 4 }),
    db.galleryMedia.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.review.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.ticket.count(), db.trip.count({ where: { published: true, departsAt: { gt: new Date() } } }), db.destination.count(), db.article.count({ where: liveArticles() }),
    db.siteSetting.findUnique({ where: { key: "heroImage" } }),
    readFeatured(),
  ]);
  const pinned = pinnedIds.length ? await db.trip.findMany({ where: { id: { in: pinnedIds }, published: true, departsAt: { gt: new Date() } }, include: tripInclude }) : [];
  const ordered = pinnedIds.map(id => pinned.find(x => x.id === id)).filter((x): x is (typeof pinned)[number] => !!x);
  const shown = [...ordered, ...trips.filter(t => !pinnedIds.includes(t.id))].slice(0, 6);
  const next = shown[0], heroImg = heroSetting?.value ?? next?.imageUrl ?? gallery[0]?.url;
  return (
    <>
      <section className="hero">
        <div className="hero-bg">{heroImg && <img src={heroImg} alt="" />}</div>
        <div className="wrap hero-in" style={{ width: "100%" }}>
          <div className="rise">
            <p className="eyebrow">Travel. Experience. Connect.</p>
            <h1 className="disp">ADVENTURE.<br />CULTURE.<br /><span className="red">NAIROBI.</span></h1>
            <p className="mut" style={{ maxWidth: 520, fontSize: "1.1rem" }}>Discover Kenya differently. Experience unforgettable road trips, hidden destinations, and the culture that brings us together.</p>
            <div className="hero-actions"><Link className="btn" href="/trips">EXPLORE TRIPS</Link><Link className="btn ghost" href="/destinations">DISCOVER DESTINATIONS</Link><Link className="btn ghost" href="/nganya">EXPLORE NGANYA CULTURE</Link></div>
          </div>
          <aside className="glass rise" style={{ animationDelay: ".15s" }} aria-label="Next adventure">
            {next ? <>
              <p className="eyebrow">Next adventure</p>
              <h3 className="disp" style={{ fontSize: "2.2rem", margin: 0 }}>{next.title}</h3>
              <p className="mut" style={{ margin: "4px 0" }}>{next.destination.name} · {fmtDateTime(next.departsAt)}</p>
              <Countdown to={next.departsAt.toISOString()} />
              <p className="mut" style={{ fontSize: ".85rem" }}>{next._count.seats} seats left · Meet at {next.meetingPoint}</p>
              <Link className="btn" style={{ width: "100%" }} href={`/trips/${next.slug}`}>Book a seat</Link>
            </> : <><p className="eyebrow">Next adventure</p><h3 className="disp" style={{ fontSize: "2rem" }}>Trips dropping soon</h3><p className="mut">No trips are open for booking right now. Join the community below to hear first.</p><Link className="btn ghost" href="#community">Get updates</Link></>}
          </aside>
        </div>
      </section>

      <div className="strip">
        {[["Seats locked on our server", "No double bookings, ever"], ["M-Pesa payments", "STK push or Paybill"], ["QR e-tickets", "Scanned at boarding"], ["WhatsApp support", "Real people, quick answers"]].map(([a, b]) => <div key={a}><b>{a}</b><span>{b}</span></div>)}
      </div>

      <section className="wrap"><Head t="Featured upcoming trips" href="/trips" />
        <div className="grid">{shown.map(t => <TripCard key={t.id} t={toCard(t)} />)}{!shown.length && <div className="empty">New trips are coming soon. Join the community below to hear first.</div>}</div>
      </section>

      <section className="wrap" style={{ paddingTop: 0 }}><Head t="Book in four steps" />
        <div className="grid">{[["1", "Pick a trip", "Browse by date, type, destination or budget."], ["2", "Choose your seats", "Live seat map. Seats are held for you for 10 minutes."], ["3", "Pay with M-Pesa", "STK push to your phone or manual Paybill. One clear total."], ["4", "Get your ticket", "QR ticket on the booking page and on WhatsApp."]].map(([n, h, p]) => <div key={n} className="card"><div className="stat">{n}</div><h3>{h}</h3><p className="mut" style={{ margin: 0 }}>{p}</p></div>)}</div>
      </section>

      {nganya.length > 0 && <section className="wrap" style={{ background: "var(--mid)", maxWidth: "none" }}><div style={{ maxWidth: 1248, margin: "0 auto" }}>
        <Head t="Nganya culture spotlight" href="/nganya" more="Enter the culture" />
        <div className="grid">{nganya.map(n => <Link key={n.id} href="/nganya" className="card" style={{ padding: 0, overflow: "hidden" }}>{n.imageUrl && <img src={n.imageUrl} alt={n.name} loading="lazy" style={{ aspectRatio: "16/10", objectFit: "cover", width: "100%" }} />}<div style={{ padding: 20 }}><h3 className="disp" style={{ fontSize: "1.8rem", margin: 0 }}>{n.name}</h3><p className="mut" style={{ margin: 0 }}>{n.crew}</p></div></Link>)}</div>
      </div></section>}

      {news.length > 0 && <section className="wrap"><Head t="Latest news & stories" href="/news" />
        <div className="grid">{news.map(a => <Link key={a.id} className="card" href={`/news/${a.slug}`} style={{ padding: 0, overflow: "hidden" }}>{a.coverUrl && <img src={a.coverUrl} alt="" loading="lazy" style={{ aspectRatio: "16/9", objectFit: "cover", width: "100%" }} />}<div style={{ padding: 20 }}><span className="badge red">{a.category}</span><h3 style={{ marginTop: 10 }}>{a.title}</h3><p className="mut" style={{ margin: 0 }}>{a.excerpt}</p></div></Link>)}</div>
      </section>}

      {dests.length > 0 && <section className="wrap" style={{ paddingTop: 0 }}><Head t="Popular destinations" href="/destinations" />
        <div className="grid">{dests.map(d => <Link key={d.id} className="card" href={`/destinations/${d.slug}`} style={{ padding: 0, overflow: "hidden" }}>{d.imageUrl ? <img src={d.imageUrl} alt="" loading="lazy" style={{ aspectRatio: "4/3", objectFit: "cover", width: "100%" }} /> : <div className="tcard-ph" style={{ position: "static", aspectRatio: "4/3", background: "var(--elev)" }}>{d.name}</div>}<div style={{ padding: 20 }}><h3 style={{ margin: 0 }}>{d.name}</h3><p className="mut" style={{ margin: "4px 0 0" }}>{d.region || d.travelTime}</p></div></Link>)}</div>
      </section>}

      {gallery.length > 0 && <section className="wrap" style={{ paddingTop: 0 }}><Head t="Gallery of experiences" href="/gallery" more="Open gallery" />
        <div className="masonry">{gallery.map(m => <Link key={m.id} href="/gallery" style={{ display: "block", marginBottom: 12 }}><img src={m.url} alt={m.caption || m.category} loading="lazy" style={{ borderRadius: 12 }} /></Link>)}</div>
      </section>}

      {reviews.length > 0 && <section className="wrap" style={{ paddingTop: 0 }}><Head t="What travellers say" />
        <div className="grid">{reviews.map(r => <div key={r.id} className="card"><div className="red">{"★".repeat(r.rating)}</div><p>{r.body}</p><b>{r.name}</b> <span className="mut">· verified traveller</span></div>)}</div>
      </section>}

      <section className="wrap" style={{ paddingTop: 0 }}><div className="grid" style={{ textAlign: "center" }}>
        {[[seatsBooked, "Seats booked"], [tripCount, "Upcoming trips"], [destCount, "Destinations"], [storyCount, "Stories published"]].map(([n, l]) => <div key={String(l)} className="card"><div className="stat">{n}</div><span className="mut">{l}</span></div>)}
      </div></section>

      <section id="community" className="wrap"><div className="glass" style={{ textAlign: "center", padding: "clamp(28px,5vw,56px)" }}>
        <p className="eyebrow">Community</p><h2 className="disp" style={{ fontSize: "clamp(2.2rem,5vw,3.6rem)" }}>Never miss a <span className="red">trip drop</span></h2>
        <p className="mut" style={{ maxWidth: 520, margin: "0 auto 20px" }}>New trips, Nganya news and community highlights. No spam.</p>
        <div style={{ display: "flex", justifyContent: "center" }}><NewsletterForm /></div>
      </div></section>

      {wa && <section className="wrap" style={{ paddingTop: 0, textAlign: "center" }}><h2>Questions before you book?</h2><p className="mut">Message us on WhatsApp for booking help, trip inquiries and support.</p><a className="btn" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a></section>}
    </>
  );
}
