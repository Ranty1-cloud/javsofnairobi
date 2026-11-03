import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { confirmPayment } from "@/lib/confirm";
// Daraja C2B is unsigned, so the URL carries a secret (?k=...) and we only act on an exact reference + exact amount match.
export async function POST(req: Request) {
  const ack = NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  const secret = process.env.MPESA_C2B_SECRET;
  if (!secret || new URL(req.url).searchParams.get("k") !== secret) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const e = await req.json();
  const ref = String(e.BillRefNumber ?? "").trim().toUpperCase(), amt = Number(e.TransAmount), trans = String(e.TransID ?? "");
  const bk = await db.booking.findUnique({ where: { reference: ref }, include: { payments: true } });
  const pay = bk?.payments.find(p => p.provider === "mpesa_manual" && p.status === "PENDING");
  await db.auditLog.create({ data: { action: "c2b.received", detail: { trans, ref, amt, matched: !!pay } } });
  if (!pay || amt !== pay.amountKes) return ack; // unmatched or wrong amount: left for staff in the audit log
  try { await db.payment.update({ where: { id: pay.id }, data: { providerRef: trans } }); } catch { return ack; } // replayed TransID
  await confirmPayment(pay.id, trans);
  return ack;
}
