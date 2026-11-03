import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { issueTickets } from "@/lib/tickets";
import { notifyBooking } from "@/lib/whatsapp";
import { awardPoints } from "@/lib/loyalty";
// Daraja does not sign callbacks, so we only trust a callback that matches a CheckoutRequestID we issued and the exact amount.
export async function POST(req: Request) {
  const cb = (await req.json())?.Body?.stkCallback;
  const ack = NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  if (!cb?.CheckoutRequestID) return ack;
  const pay = await db.payment.findUnique({ where: { providerRef: cb.CheckoutRequestID } });
  if (!pay || pay.status === "SUCCESS") return ack; // unknown or duplicate
  const items: { Name: string; Value: number }[] = cb.CallbackMetadata?.Item ?? [];
  const paid = items.find(i => i.Name === "Amount")?.Value;
  const ok = cb.ResultCode === 0 && paid === pay.amountKes;
  const bk = await db.booking.findUnique({ where: { id: pay.bookingId } });
  if (ok && bk?.status !== "PENDING") { // paid after the booking expired or was cancelled: record it, do not confirm, flag for refund
    await db.$transaction([db.payment.update({ where: { id: pay.id }, data: { status: "SUCCESS", rawCallback: cb } }), db.auditLog.create({ data: { action: "payment.late_needs_refund", detail: { bookingId: pay.bookingId } } })]);
    return ack;
  }
  await db.$transaction([
    db.payment.update({ where: { id: pay.id }, data: { status: ok ? "SUCCESS" : "FAILED", rawCallback: cb } }),
    ...(ok ? [db.booking.update({ where: { id: pay.bookingId }, data: { status: "CONFIRMED" } }), db.tripSeat.updateMany({ where: { bookingId: pay.bookingId }, data: { status: "BOOKED", heldBy: null, heldUntil: null } })] : []),
    db.auditLog.create({ data: { action: "mpesa.callback", detail: { ref: cb.CheckoutRequestID, ok } } }),
  ]);
  if (ok) {
    await issueTickets(pay.bookingId);
    await awardPoints(pay.bookingId);
    try { await notifyBooking(pay.bookingId); } catch (e) { console.error("whatsapp send failed", e); } // never block the M-Pesa ack
  }
  return ack;
}
