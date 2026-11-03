import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import PaymentsList from "@/components/PaymentsList";
export const dynamic = "force-dynamic";
export default async function Payments() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER", "BOOKING_MANAGER"]))) redirect("/");
  const list = await db.payment.findMany({ where: { provider: "mpesa_manual", status: "PENDING", booking: { status: "PENDING" } }, include: { booking: true }, orderBy: { createdAt: "asc" } });
  const items = list.map(p => ({ id: p.id, reference: p.booking.reference, amount: p.amountKes, code: p.providerRef, phone: p.booking.phone, created: p.createdAt.toISOString() })).sort((a, b) => Number(!!b.code) - Number(!!a.code));
  return <main className="wrap"><h1>Manual <span style={{ color: "#E50914" }}>Payments</span></h1><p className="mut">Match the code and exact amount against your M-Pesa statement before confirming. Paid-with-wrong-amount cases appear in the audit log (c2b.received, matched: false).</p><PaymentsList items={items} /></main>;
}
