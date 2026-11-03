import { db } from "./db";
import { issueTickets } from "./tickets";
import { awardPoints } from "./loyalty";
import { notifyBooking } from "./whatsapp";
// Single confirmation path for STK callbacks, manual verification and C2B auto-match.
// The payment row is claimed with a conditional update inside one transaction, so duplicate or concurrent callbacks are a no-op.
export async function confirmPayment(paymentId: string, receipt?: string) {
  const result = await db.$transaction(async tx => {
    const pay = await tx.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
    if (!pay) return "noop" as const;
    const claimed = await tx.payment.updateMany({ where: { id: pay.id, status: { not: "SUCCESS" } }, data: { status: "SUCCESS", providerRef: receipt ?? undefined } });
    if (!claimed.count) return "noop" as const;
    if (pay.booking.status !== "PENDING") { // paid after expiry or cancellation: record it and flag for refund, never confirm
      await tx.auditLog.create({ data: { action: "payment.late_needs_refund", detail: { bookingId: pay.bookingId, paymentId } } });
      return "late" as const;
    }
    await tx.booking.update({ where: { id: pay.bookingId }, data: { status: "CONFIRMED" } });
    await tx.tripSeat.updateMany({ where: { bookingId: pay.bookingId }, data: { status: "BOOKED", heldBy: null, heldUntil: null } });
    await tx.auditLog.create({ data: { action: "payment.confirmed", detail: { paymentId, provider: pay.provider } } });
    return { bookingId: pay.bookingId } as const;
  });
  if (typeof result === "string") return result;
  await issueTickets(result.bookingId); await awardPoints(result.bookingId);
  try { await notifyBooking(result.bookingId); } catch (e) { console.error("whatsapp", e); }
  return "confirmed" as const;
}
