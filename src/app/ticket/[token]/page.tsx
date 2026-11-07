import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { qrSvg } from "@/lib/ticket-qr";
import { fmtDate, fmtTime } from "@/lib/format";
import PrintButton from "@/components/PrintButton";
import ReviewForm from "@/components/ReviewForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your ticket", robots: { index: false } };
const css = `
.tk{--bg:#101010;--fg:#fff;--mu:#9a9a9a;--ln:#2a2a2a;width:min(380px,100%);background:var(--bg);color:var(--fg);border:1px solid var(--ln);border-radius:20px;overflow:hidden;position:relative;box-shadow:0 30px 80px #000a}
.tk-top{background:linear-gradient(135deg,#0a0a0a,#1a1a1a);padding:20px 22px 16px;border-bottom:3px solid #E50914;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.tk-brand{font-family:var(--font-bebas),sans-serif;font-size:1.7rem;letter-spacing:.06em;line-height:1}.tk-brand span{color:#E50914}.tk-sub{font-size:.62rem;letter-spacing:.3em;color:var(--mu);margin-top:4px}
.tk-pay{font-size:.7rem;font-weight:800;letter-spacing:.12em;padding:6px 12px;border-radius:99px;background:#E50914;color:#fff}.tk-pay.pending{background:#d9a400}
.tk-body{padding:22px}.tk-title{font-family:var(--font-bebas),sans-serif;font-size:2.1rem;letter-spacing:.02em;line-height:1.02;margin:0 0 18px}
.tk-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 12px}.tk-grid small{display:block;font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:var(--mu);margin-bottom:2px}.tk-grid b{font-size:.98rem}.tk-wide{grid-column:1/-1}.tk-seat{font-family:var(--font-bebas),sans-serif;font-size:2rem!important;color:#E50914;line-height:1}
.tk-perf{position:relative;margin:4px 0;border-top:2px dashed var(--ln)}.tk-perf:before,.tk-perf:after{content:"";position:absolute;top:-12px;width:22px;height:22px;border-radius:50%;background:#050505;border:1px solid var(--ln)}.tk-perf:before{left:-12px}.tk-perf:after{right:-12px}
.tk-qr{padding:20px 22px 24px;text-align:center}.tk-qrbox{background:#fff;border-radius:16px;padding:12px;width:230px;margin:0 auto;box-shadow:0 0 0 1px #ddd}.tk-qrbox svg{display:block;width:100%;height:auto}
.tk-code{margin-top:12px;font:600 .8rem ui-monospace,Menlo,monospace;letter-spacing:.3em;color:var(--mu)}.tk-note{font-size:.72rem;color:var(--mu);margin:6px 0 0}.tk-in{margin-top:12px;display:inline-block;padding:6px 14px;border-radius:99px;background:#d9a40022;color:#d9a400;font-size:.78rem;font-weight:700}
.tk-acts{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:18px}
@media print{
  @page{size:A5 portrait;margin:10mm}
  html,body{background:#fff!important}.no-print,header.nav,footer,.sticky-cta,.help-float,.skip{display:none!important}body{padding:0!important}
  .tk{--bg:#fff;--fg:#0a0a0a;--mu:#555;--ln:#cfcfcf;box-shadow:none;margin:0 auto;-webkit-print-color-adjust:exact;print-color-adjust:exact;break-inside:avoid}
  .tk-top{background:#0a0a0a!important;color:#fff}.tk-top .tk-sub{color:#bbb}.tk-perf:before,.tk-perf:after{background:#fff}
}`;
export default async function TicketPage({ params }: { params: { token: string } }) {
  const t = await db.ticket.findUnique({ where: { token: params.token }, include: { seat: true, booking: { include: { trip: true, payments: true } } } });
  if (!t || t.booking.status !== "CONFIRMED") notFound();
  const svg = qrSvg(t.token); // carries only the opaque token, never passenger data
  const trip = t.booking.trip, paid = t.booking.payments.some(p => p.status === "SUCCESS");
  return (
    <main style={{ display: "grid", placeItems: "center", padding: "24px 16px 40px" }}>
      <style>{css}</style>
      <article className="tk" aria-label="Boarding pass">
        <div className="tk-top">
          <div><div className="tk-brand">JAVS <span>OF NAIROBI</span></div><div className="tk-sub">BOARDING PASS</div></div>
          <span className={`tk-pay${paid ? "" : " pending"}`}>{paid ? "PAID" : "PENDING"}</span>
        </div>
        <div className="tk-body">
          <h1 className="tk-title">{trip.title}</h1>
          <div className="tk-grid">
            <div><small>Date</small><b>{fmtDate(trip.departsAt)}</b></div><div><small>Departs</small><b>{fmtTime(trip.departsAt)}</b></div>
            <div className="tk-wide"><small>Meeting point</small><b>{trip.meetingPoint}</b></div>
            <div><small>Passenger</small><b>{t.passengerName}</b></div><div><small>Seat</small><b className="tk-seat">{t.seat.label}</b></div>
            <div><small>Booking ref</small><b>{t.booking.reference}</b></div><div><small>Ticket code</small><b style={{ fontFamily: "ui-monospace,Menlo,monospace", letterSpacing: ".12em" }}>{t.token.slice(0, 8).toUpperCase()}</b></div>
          </div>
        </div>
        <div className="tk-perf" />
        <div className="tk-qr">
          <div className="tk-qrbox" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="tk-note">Show this code at boarding. One scan per ticket.</p>
          {t.checkedInAt && <span className="tk-in">Checked in</span>}
        </div>
      </article>
      <div className="no-print tk-acts"><a className="btn" href={`/api/tickets/${t.token}/pdf`}>Download PDF</a><PrintButton /></div>
      {t.checkedInAt && <div className="no-print"><ReviewForm token={t.token} /></div>}
    </main>
  );
}
