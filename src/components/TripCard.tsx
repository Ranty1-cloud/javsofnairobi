import Link from "next/link";
import { fmtDate, fmtTime, ksh, TYPE_LABEL } from "@/lib/format";
export type CardTrip = { slug: string; title: string; category: string; tripType: string; durationLabel: string; imageUrl: string | null; isSample: boolean; departsAt: Date; meetingPoint: string; priceKes: number; bookingFeeKes: number; destination: { name: string }; left: number };
export default function TripCard({ t }: { t: CardTrip }) {
  const soldOut = t.left === 0, few = t.left > 0 && t.left <= 4;
  return (
    <article className="tcard">
      <Link href={`/trips/${t.slug}`} className="tcard-img" aria-label={t.title}>
        {t.imageUrl ? <img src={t.imageUrl} alt="" loading="lazy" /> : <div className="tcard-ph">{t.title}</div>}
        <div className="tcard-badges"><span className="badge red">{t.category}</span>{t.isSample && <span className="badge">Sample</span>}{soldOut ? <span className="badge amber">Sold out · waitlist</span> : few && <span className="badge amber">Only {t.left} left</span>}</div>
      </Link>
      <div className="tcard-body">
        <h3><Link href={`/trips/${t.slug}`}>{t.title}</Link></h3>
        <span className="mut" style={{ fontSize: ".85rem" }}>{t.destination.name}</span>
        <div className="tmeta"><span>{fmtDate(t.departsAt)}</span><span>Departs {fmtTime(t.departsAt)}</span><span>{TYPE_LABEL[t.tripType] ?? t.tripType}{t.durationLabel && ` · ${t.durationLabel}`}</span><span>{soldOut ? "No seats" : `${t.left} seats left`}</span><span style={{ gridColumn: "1/-1" }}>Meet: {t.meetingPoint}</span></div>
        <div className="tfoot"><div><div className="price">{ksh(t.priceKes)}</div>{t.bookingFeeKes > 0 && <small className="mut">+ {ksh(t.bookingFeeKes)} booking fee</small>}</div><Link className="btn sm" href={`/trips/${t.slug}`}>{soldOut ? "Join waitlist" : "Book now"}</Link></div>
      </div>
    </article>
  );
}
