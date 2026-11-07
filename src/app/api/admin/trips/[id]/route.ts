import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { waSend } from "@/lib/whatsapp";
import { refreshSite } from "@/lib/refresh";
import { isCounty } from "@/lib/kenya";
import { resolveDestination } from "@/lib/destinations";
const b = z.object({ county: z.string().refine(isCounty).optional(), town: z.string().max(80).optional(), departsAt: z.coerce.date().optional(), meetingPoint: z.string().min(2).max(160).optional(), published: z.boolean().optional(), imageUrl: z.string().url().optional(), title: z.string().min(3).max(120).optional(), summary: z.string().max(600).optional(), category: z.string().min(2).max(60).optional(), tripType: z.enum(["DAY", "OVERNIGHT", "WEEKEND"]).optional(), durationLabel: z.string().max(60).optional(), notify: z.boolean().default(false) });
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { notify, county, town, ...rest } = p.data;
  const data: typeof rest & { destinationId?: string } = { ...rest };
  if (county) data.destinationId = await resolveDestination(county, town ?? ""); // picking a county (and town) moves the event to that place
  const trip = await db.trip.update({ where: { id: params.id }, data });
  if (data.published) await db.trip.updateMany({ where: { id: params.id }, data: { isSample: false } }); // publishing means staff chose to show it
  await db.auditLog.create({ data: { actor: u.id, action: "trip.update", detail: { tripId: trip.id, ...data } } });
  let notified = 0;
  const tpl = process.env.WHATSAPP_UPDATE_TEMPLATE;
  if (notify && tpl && (data.departsAt || data.meetingPoint)) {
    const bookings = await db.booking.findMany({ where: { tripId: trip.id, status: "CONFIRMED", whatsappOptIn: true, phone: { not: null } }, include: { passengers: true } });
    for (const bk of bookings) if (await waSend(bk.phone!, tpl, [bk.passengers[0]?.name ?? "there", trip.title, trip.departsAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" }), trip.meetingPoint])) notified++;
  }
  refreshSite(); return NextResponse.json({ trip, notified });
}
