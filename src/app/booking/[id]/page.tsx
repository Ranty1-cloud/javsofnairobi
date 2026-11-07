import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession, requireRole, STAFF } from "@/lib/session";
import { db } from "@/lib/db";
import AutoRefresh from "@/components/AutoRefresh";
import { TILL } from "@/lib/pay";
import ManualPay from "@/components/ManualPay";
export const dynamic = "force-dynamic";
export default async function Booking({ params }: { params: { id: string } }) {
  const b = await db.booking.findUnique({ where: { id: params.id }, include: { trip: true, seats: true, tickets: true, payments: true } });
  const me = await getSession();
  if (!me) redirect(`/login?next=${encodeURIComponent("/booking/" + params.id)}`);
  if (!b || (b.userId !== me.userId && !(await requireRole(STAFF)))) notFound();
  const pay = b.payments[b.payments.length - 1];
  const msg: Record<string, string> = { PENDING: "Waiting for your M-Pesa payment. Enter your PIN on the prompt sent to your phone.", CONFIRMED: "Payment confirmed. Your tickets are ready.", EXPIRED: "This booking expired before payment. Your seats were released.", CANCELLED: "This booking was cancelled." };
  return (
    <main className="wrap" style={{ maxWidth: 640 }}>
      <AutoRefresh active={b.status === "PENDING" && pay?.status !== "FAILED"} />
      <h1>Booking <span style={{ color: "#E50914" }}>{b.reference}</span></h1>
      <p>{b.trip.title} · {b.trip.departsAt.toLocaleString("en-KE")}</p>
      <p>Seats: {b.seats.map(s => s.label).join(", ") || "released"} · Total <b>KSh {b.totalKes.toLocaleString()}</b></p>
      <div className="card"><b>{pay?.status === "FAILED" ? "Payment failed or was cancelled. Please try again." : msg[b.status]}</b></div>
      {b.status === "PENDING" && pay?.provider === "mpesa_manual" && pay.status === "PENDING" && <ManualPay id={b.id} till={TILL} reference={b.reference} amount={pay.amountKes} submitted={pay.providerRef} />}
      {b.status === "CONFIRMED" && <><h3>Your tickets</h3>{b.tickets.map(t => <p key={t.id}><Link className="btn" href={`/ticket/${t.token}`}>{t.passengerName}</Link> <a className="mut" href={`/ticket/${t.token}?print=1`}>Print</a> · <a className="mut" href={`/api/tickets/${t.token}/pdf`}>PDF</a></p>)}{!b.tickets.length && <p className="mut">Generating tickets...</p>}</>}
      {(b.status !== "CONFIRMED") && <p><Link href={`/trips/${b.trip.slug}`} className="btn">Back to seats</Link></p>}
    </main>
  );
}
