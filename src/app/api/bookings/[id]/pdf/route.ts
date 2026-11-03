import { NextResponse } from "next/server";
import { getSession, requireRole, STAFF } from "@/lib/session";
import { ticketsForBooking, renderTicketsPdf } from "@/lib/pdf";
// All tickets for a booking in one PDF. Booking ids are not secrets, so this needs the owner's session or staff access.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const pack = await ticketsForBooking(params.id);
  if (!pack) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pack.userId !== s.userId && !(await requireRole(STAFF))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bytes = await renderTicketsPdf(pack.data);
  return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="javs-tickets-${pack.reference}.pdf"`, "Cache-Control": "private, no-store" } });
}
