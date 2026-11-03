import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
const body = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), title: z.string().min(3), category: z.string(), destinationId: z.string(), vehicleId: z.string(), departsAt: z.coerce.date(), meetingPoint: z.string(), priceKes: z.number().int().positive(), premiumPriceKes: z.number().int().positive().optional(), bookingFeeKes: z.number().int().min(0).default(0), published: z.boolean().default(false) });
export async function POST(req: Request) {
  const admin = await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input", issues: p.error.issues }, { status: 400 });
  const { premiumPriceKes, ...data } = p.data;
  const veh = await db.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!veh) return NextResponse.json({ error: "Unknown vehicle" }, { status: 400 });
  const { rows, cols } = veh.layout as { rows: string[]; cols: number[] };
  const trip = await db.trip.create({ data: { ...data, isSample: false } });
  await db.tripSeat.createMany({ data: rows.flatMap((r, i) => cols.map(c => ({ tripId: trip.id, label: `${r}${c}`, priceKes: i === 0 && premiumPriceKes ? premiumPriceKes : data.priceKes }))) });
  await db.auditLog.create({ data: { actor: admin.id, action: "trip.create", detail: { tripId: trip.id } } });
  return NextResponse.json(trip, { status: 201 });
}
