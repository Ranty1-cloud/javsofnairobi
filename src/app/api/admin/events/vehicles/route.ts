import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { refreshSite } from "@/lib/refresh";
import { addVehicleToTrip } from "@/lib/trip-vehicles";
const ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"] as const;

// Add another vehicle to an event. Works while the event is live, so people can pick a different vehicle.
export async function POST(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ tripId: z.string(), vehicleId: z.string(), name: z.string().max(60).optional(), priceKes: z.number().int().positive(), premiumPriceKes: z.number().int().positive().optional() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Choose a vehicle and enter the seat price." }, { status: 400 });
  const trip = await db.trip.findUnique({ where: { id: p.data.tripId }, select: { id: true } });
  if (!trip) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  try {
    const tv = await addVehicleToTrip(p.data.tripId, p.data.vehicleId, p.data);
    await db.auditLog.create({ data: { actor: u.id, action: "trip.vehicle_add", detail: { tripId: p.data.tripId, tripVehicleId: tv.id, vehicleId: p.data.vehicleId } } });
    refreshSite(); return NextResponse.json({ ok: true, id: tv.id }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}

export async function PATCH(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ id: z.string(), name: z.string().min(1).max(60) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter a name" }, { status: 400 });
  await db.tripVehicle.update({ where: { id: p.data.id }, data: { name: p.data.name.trim() } });
  await db.auditLog.create({ data: { actor: u.id, action: "trip.vehicle_rename", detail: { id: p.data.id } } });
  refreshSite(); return NextResponse.json({ ok: true });
}

// A vehicle can be removed only while none of its seats is held or booked, and never the first one.
export async function DELETE(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const tv = await db.tripVehicle.findUnique({ where: { id }, select: { id: true, position: true, tripId: true } });
  if (!tv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (tv.position === 0) return NextResponse.json({ error: "The first vehicle cannot be removed." }, { status: 409 });
  const used = await db.tripSeat.count({ where: { tripVehicleId: id, OR: [{ status: { not: "AVAILABLE" } }, { bookingId: { not: null } }] } });
  if (used > 0) return NextResponse.json({ error: `${used} seat${used === 1 ? " is" : "s are"} booked or being held on this vehicle, so it cannot be removed.` }, { status: 409 });
  await db.tripVehicle.delete({ where: { id } }); // its seats go with it
  await db.auditLog.create({ data: { actor: u.id, action: "trip.vehicle_remove", detail: { id, tripId: tv.tripId } } });
  refreshSite(); return NextResponse.json({ ok: true });
}
