import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { waSend } from "@/lib/whatsapp";
const b = z.object({ departsAt: z.coerce.date().optional(), meetingPoint: z.string().min(2).optional(), published: z.boolean().optional(), imageUrl: z.string().url().optional(), notify: z.boolean().default(false) });
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { notify, ...data } = p.data;
  const trip = await db.trip.update({ where: { id: params.id }, data });
  await db.auditLog.create({ data: { actor: u.id, action: "trip.update", detail: { tripId: trip.id, ...data } } });
  let notified = 0;
  const tpl = process.env.WHATSAPP_UPDATE_TEMPLATE;
  if (notify && tpl && (data.departsAt || data.meetingPoint)) {
    const bookings = await db.booking.findMany({ where: { tripId: trip.id, status: "CONFIRMED", whatsappOptIn: true, phone: { not: null } }, include: { passengers: true } });
    for (const bk of bookings) if (await waSend(bk.phone!, tpl, [bk.passengers[0]?.name ?? "there", trip.title, trip.departsAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" }), trip.meetingPoint])) notified++;
  }
  return NextResponse.json({ trip, notified });
}
