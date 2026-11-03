import { db } from "./db";
import { issueTickets } from "./tickets";
import { awardPoints } from "./loyalty";
import { notifyBooking } from "./whatsapp";
// Shared by manual verification and C2B auto-match. Idempotent: a payment that is already SUCCESS is a no-op.
export async function confirmPayment(paymentId: string, receipt?: string) {
  const pay = await db.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
  if (!pay || pay.status === "SUCCESS") return "noop";
  if (pay.booking.status !== "PENDING") { // paid after expiry or cancellation: record it and flag for refund, do not confirm
    await db.$transaction([db.payment.update({ where: { id: pay.id }, data: { status: "SUCCESS", providerRef: receipt ?? pay.providerRef } }), db.auditLog.create({ data: { action: "payment.late_needs_refund", detail: { bookingId: pay.bookingId } } })]);
    return "late";
  }
  await db.$transaction([
    db.payment.update({ where: { id: pay.id }, data: { status: "SUCCESS", providerRef: receipt ?? pay.providerRef } }),
    db.booking.update({ where: { id: pay.bookingId }, data: { status: "CONFIRMED" } }),
    db.tripSeat.updateMany({ where: { bookingId: pay.bookingId }, data: { status: "BOOKED", heldBy: null, heldUntil: null } }),
    db.auditLog.create({ data: { action: "payment.confirmed", detail: { paymentId, provider: pay.provider } } }),
  ]);
  await issueTickets(pay.bookingId); await awardPoints(pay.bookingId);
  try { await notifyBooking(pay.bookingId); } catch (e) { console.error("whatsapp", e); }
  return "confirmed";
}
