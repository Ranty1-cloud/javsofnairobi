import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import SeatMap from "@/components/SeatMap";
import SubmitForm from "@/components/SubmitForm";
import Countdown from "@/components/Countdown";
import ShareButtons from "@/components/ShareButtons";
import { fmtDate, fmtTime, ksh, TYPE_LABEL, site } from "@/lib/format";
export const dynamic = "force-dynamic"; // live seat map
const bySlug = cache((slug: string) => db.trip.findUnique({ where: { slug }, include: { destination: true, seats: { orderBy: { label: "asc" } }, reviews: { where: { approved: true }, orderBy: { createdAt: "desc" } } } }));
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const t = await bySlug(params.slug);
  if (!t || !t.published) return {};
  const desc = t.summary || `${t.title} to ${t.destination.name}. From ${ksh(t.priceKes)}.`;
  return { title: t.title, description: desc, openGraph: { title: t.title, description: desc }, twitter: { card: "summary_large_image" } };
}
export default async function TripPage({ params }: { params: { slug: string } }) {
  const trip = await bySlug(params.slug);
  if (!trip || !trip.published) notFound();
  const now = new Date();
  const seats = trip.seats.map(s => ({ label: s.label, priceKes: s.priceKes, status: s.status === "RESERVED" && s.heldUntil && s.heldUntil < now && !s.bookingId ? "AVAILABLE" : s.status }));
  const left = seats.filter(s => s.status === "AVAILABLE").length, past = trip.departsAt < now;
  const avg = trip.reviews.length ? trip.reviews.reduce((a, r) => a + r.rating, 0) / trip.reviews.length : 0;
  const ld = { "@context": "https://schema.org", "@type": "Event", name: trip.title, startDate: trip.departsAt.toISOString(), eventStatus: "https://schema.org/EventScheduled", location: { "@type": "Place", name: trip.meetingPoint, address: "Nairobi, Kenya" }, image: trip.imageUrl ? [trip.imageUrl] : undefined, offers: { "@type": "Offer", price: trip.priceKes, priceCurrency: "KES", availability: left ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: `${site()}/trips/${trip.slug}` } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <section className="page-hero">{trip.imageUrl && <img src={trip.imageUrl} alt="" />}
        <div className="wrap" style={{ width: "100%", paddingBottom: 32 }}>
          <span className="badge red">{trip.category}</span>
          <h1 className="disp">{trip.title}</h1>
          <p className="mut" style={{ margin: 0 }}><Link href={`/destinations/${trip.destination.slug}`}>{trip.destination.name}</Link> · {fmtDate(trip.departsAt)}</p>
        </div>
      </section>
      <div className="wrap">
        <div className="facts">
          <div><small>Departs</small>{fmtTime(trip.departsAt)}</div><div><small>Meeting point</small>{trip.meetingPoint}</div>
          <div><small>Type</small>{TYPE_LABEL[trip.tripType] ?? trip.tripType}{trip.durationLabel && ` · ${trip.durationLabel}`}</div>
          <div><small>From</small><span className="price">{ksh(trip.priceKes)}</span>{trip.bookingFeeKes > 0 && <span className="mut"> + {ksh(trip.bookingFeeKes)} fee</span>}</div>
          <div><small>Seats left</small>{left}</div>
          {!past && <div><small>Departs in</small><Countdown to={trip.departsAt.toISOString()} /></div>}
        </div>
        {!past && <ShareButtons title={trip.title} line={`${fmtDate(trip.departsAt)} · ${fmtTime(trip.departsAt)} · From ${ksh(trip.priceKes)}${left > 0 ? ` · ${left} seats left` : ""}`} />}
        {trip.summary && <p className="prose" style={{ maxWidth: 760 }}>{trip.summary}</p>}
        <h2 style={{ marginTop: 32 }}>Choose your seats</h2>
        {past ? <p className="note">This trip has already departed.</p> : left > 0 ? <SeatMap tripId={trip.id} seats={seats} fee={trip.bookingFeeKes} /> : <div className="card narrow"><h3>Fully booked</h3><p className="mut">Join the waitlist and we&apos;ll message you if seats open up.</p><SubmitForm endpoint="/api/waitlist" extra={{ tripId: trip.id }} fields={["contact"]} label="Join waitlist (phone or email)" /></div>}
        <h2 style={{ marginTop: 48 }}>Reviews{avg > 0 && <span className="red"> · {avg.toFixed(1)}/5</span>}</h2>
        <div className="grid">{trip.reviews.map(r => <div key={r.id} className="card"><div className="red">{"★".repeat(r.rating)}</div><p>{r.body}</p><b>{r.name}</b></div>)}{!trip.reviews.length && <div className="empty">No reviews yet. Travellers can review after their trip.</div>}</div>
      </div>
    </>
  );
}
