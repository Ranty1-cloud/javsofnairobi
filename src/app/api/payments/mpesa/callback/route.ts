import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { confirmPayment } from "@/lib/confirm";
// Daraja does not sign callbacks, so we only trust a callback that matches a CheckoutRequestID we issued and the exact amount.
// Confirmation goes through the shared, atomic confirmPayment, so duplicates and replays are harmless.
export async function POST(req: Request) {
  const ack = NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  let cb;
  try { cb = (await req.json())?.Body?.stkCallback; } catch { return ack; }
  if (!cb?.CheckoutRequestID) return ack;
  const pay = await db.payment.findUnique({ where: { providerRef: String(cb.CheckoutRequestID) } });
  if (!pay || pay.status === "SUCCESS") return ack; // unknown or duplicate
  const items: { Name: string; Value: number }[] = cb.CallbackMetadata?.Item ?? [];
  const paid = Number(items.find(i => i.Name === "Amount")?.Value);
  await db.payment.update({ where: { id: pay.id }, data: { rawCallback: cb } });
  if (cb.ResultCode !== 0) {
    await db.$transaction([db.payment.updateMany({ where: { id: pay.id, status: { not: "SUCCESS" } }, data: { status: "FAILED" } }), db.auditLog.create({ data: { action: "mpesa.callback", detail: { ref: cb.CheckoutRequestID, ok: false, code: cb.ResultCode } } })]);
    return ack;
  }
  if (paid !== pay.amountKes) { // money moved but the amount is wrong: leave PENDING and flag for staff, never auto-confirm
    await db.auditLog.create({ data: { action: "mpesa.amount_mismatch", detail: { paymentId: pay.id, expected: pay.amountKes, paid } } });
    return ack;
  }
  const receipt = items.find(i => i.Name === "MpesaReceiptNumber")?.Value;
  await db.auditLog.create({ data: { action: "mpesa.callback", detail: { ref: cb.CheckoutRequestID, ok: true, receipt } } });
  try { await confirmPayment(pay.id); } catch (e) { console.error("confirm failed", e); }
  return ack;
}
