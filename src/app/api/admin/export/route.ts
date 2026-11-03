import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
const cell = (v: unknown) => { let s = v instanceof Date ? v.toISOString() : String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; }; // blocks spreadsheet formula injection
export async function GET(req: Request) {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER", "BOOKING_MANAGER"]))) return new Response("Forbidden", { status: 403 });
  const type = new URL(req.url).searchParams.get("type") === "payments" ? "payments" : "bookings";
  const rows: unknown[][] = type === "payments"
    ? [["reference", "provider", "amountKes", "status", "createdAt"], ...(await db.payment.findMany({ include: { booking: true }, orderBy: { createdAt: "desc" } })).map(p => [p.booking.reference, p.provider, p.amountKes, p.status, p.createdAt])]
    : [["reference", "trip", "status", "totalKes", "discountKes", "promoCode", "createdAt"], ...(await db.booking.findMany({ include: { trip: true }, orderBy: { createdAt: "desc" } })).map(b => [b.reference, b.trip.title, b.status, b.totalKes, b.discountKes, b.promoCode, b.createdAt])];
  return new Response(rows.map(r => r.map(cell).join(",")).join("\n"), { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${type}.csv"` } });
}
