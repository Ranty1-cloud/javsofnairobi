import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { fmtDate, fmtTime, ksh } from "@/lib/format";
import { LOGO_DATA_URI } from "@/lib/brand-logo";
// The preview card WhatsApp, Instagram, Facebook and X show when someone shares a trip link.
export const alt = "JAVS OF NAIROBI trip";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;
export default async function Card({ params }: { params: { slug: string } }) {
  const t = await db.trip.findUnique({ where: { slug: params.slug }, select: { title: true, published: true, departsAt: true, priceKes: true, imageUrl: true, meetingPoint: true, destination: { select: { name: true } }, _count: { select: { seats: { where: { status: "AVAILABLE" } } } } } });
  const live = !!t && t.published;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#050505", color: "#fff", fontFamily: "sans-serif" }}>
        {live && t.imageUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={t.imageUrl} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg, rgba(5,5,5,.96) 0%, rgba(5,5,5,.82) 55%, rgba(5,5,5,.35) 100%)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: "#E50914", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 72px", width: "100%", position: "relative" }}>
          <div style={{ display: "flex" }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={LOGO_DATA_URI} alt="" width={104} height={104} /></div>
          {live ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 26, color: "#E50914", letterSpacing: 4, fontWeight: 700, marginBottom: 14 }}>{t.destination.name.toUpperCase()}</div>
              <div style={{ display: "flex", fontSize: t.title.length > 34 ? 66 : 84, fontWeight: 800, lineHeight: 1.02, maxWidth: 900 }}>{t.title}</div>
              <div style={{ display: "flex", fontSize: 32, color: "#d4d4d4", marginTop: 22 }}>{fmtDate(t.departsAt)} · {fmtTime(t.departsAt)}</div>
              <div style={{ display: "flex", fontSize: 26, color: "#a1a1a1", marginTop: 6 }}>Meet at {t.meetingPoint}</div>
            </div>
          ) : (
            <div style={{ display: "flex", fontSize: 84, fontWeight: 800 }}>ADVENTURE. CULTURE. NAIROBI.</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {live && <div style={{ display: "flex", background: "#E50914", padding: "14px 30px", borderRadius: 14, fontSize: 32, fontWeight: 800 }}>From {ksh(t.priceKes)}</div>}
            {live && <div style={{ display: "flex", fontSize: 28, color: "#fff" }}>{t._count.seats > 0 ? `${t._count.seats} seats left` : "Fully booked"}</div>}
            <div style={{ display: "flex", marginLeft: "auto", fontSize: 26, color: "#a1a1a1" }}>Book your seat online</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
