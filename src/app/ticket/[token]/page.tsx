import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import PrintButton from "@/components/PrintButton";
import ReviewForm from "@/components/ReviewForm";
export const dynamic = "force-dynamic";
export default async function TicketPage({ params }: { params: { token: string } }) {
  const t = await db.ticket.findUnique({ where: { token: params.token }, include: { seat: true, booking: { include: { trip: true, payments: true } } } });
  if (!t) notFound();
  // The QR holds only the opaque token, never passenger data.
  const svg = await QRCode.toString(t.token, { type: "svg", margin: 1, color: { dark: "#050505", light: "#ffffff" } });
  const trip = t.booking.trip;
  const paid = t.booking.payments.some(p => p.status === "SUCCESS");
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 16 }}>
      <style>{`@media print{.no-print{display:none}body{background:#fff!important}}`}</style>
      <div style={{ width: 340, background: "#111", border: "1px solid #292929", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ background: "#E50914", padding: "14px 20px", fontWeight: 800, letterSpacing: 2 }}>JAVS OF NAIROBI</div>
        <div style={{ padding: 20 }}>
          <h2 style={{ margin: 0 }}>{trip.title}</h2>
          <p style={{ color: "#A1A1A1" }}>{trip.departsAt.toLocaleString("en-KE")}<br />Meet: {trip.meetingPoint}</p>
          <p>Passenger: <b>{t.passengerName}</b><br />Seat: <b>{t.seat.label}</b><br />Ref: {t.booking.reference}<br />Payment: <b style={{ color: paid ? "#fff" : "#d9a400" }}>{paid ? "PAID" : "PENDING"}</b></p>
          {t.checkedInAt && <p style={{ color: "#d9a400" }}>Checked in</p>}
          <div style={{ background: "#fff", borderRadius: 12, padding: 8, width: 200, margin: "0 auto" }} dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      </div>
      <PrintButton />
      {t.checkedInAt && <ReviewForm token={t.token} />}
    </main>
  );
}
