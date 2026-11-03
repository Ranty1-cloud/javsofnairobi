import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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
  await db.$transaction([
    db.payment.update({ where: { id: pay.id }, data: { status: ok ? "SUCCESS" : "FAILED", rawCallback: cb } }),
    ...(ok ? [db.booking.update({ where: { id: pay.bookingId }, data: { status: "CONFIRMED" } }), db.tripSeat.updateMany({ where: { bookingId: pay.bookingId }, data: { status: "BOOKED", heldBy: null, heldUntil: null } })] : []),
    db.auditLog.create({ data: { action: "mpesa.callback", detail: { ref: cb.CheckoutRequestID, ok } } }),
  ]);
  return ack;
}
