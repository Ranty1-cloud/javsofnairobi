import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { refreshSite } from "@/lib/refresh";
import { isCounty } from "@/lib/kenya";
import { resolveDestination, uniqueSlug } from "@/lib/destinations";
const body = z.object({ title: z.string().min(3).max(120), category: z.string().min(2).max(60), county: z.string().refine(isCounty, "Choose a county"), town: z.string().max(80).default(""), vehicleId: z.string(), departsAt: z.coerce.date(), meetingPoint: z.string().min(2).max(160), priceKes: z.number().int().positive(), premiumPriceKes: z.number().int().positive().optional(), bookingFeeKes: z.number().int().min(0).default(0), published: z.boolean().default(false), imageUrl: z.string().url().optional(), summary: z.string().max(600).optional(), tripType: z.enum(["DAY", "OVERNIGHT", "WEEKEND"]).default("DAY"), durationLabel: z.string().max(60).optional() });
export async function POST(req: Request) {
  const admin = await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"]);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input", issues: p.error.issues }, { status: 400 });
  const { premiumPriceKes, county, town, ...data } = p.data;
  const veh = await db.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!veh) return NextResponse.json({ error: "Unknown vehicle" }, { status: 400 });
  const { rows, cols } = veh.layout as { rows: string[]; cols: number[] };
  const [destinationId, slug] = await Promise.all([resolveDestination(county, town), uniqueSlug(data.title, async s => !!(await db.trip.findUnique({ where: { slug: s }, select: { id: true } })))]);
  const trip = await db.trip.create({ data: { ...data, slug, destinationId, isSample: false } });
  await db.tripSeat.createMany({ data: rows.flatMap((r, i) => cols.map(c => ({ tripId: trip.id, label: `${r}${c}`, priceKes: i === 0 && premiumPriceKes ? premiumPriceKes : data.priceKes }))) });
  await db.auditLog.create({ data: { actor: admin.id, action: "trip.create", detail: { tripId: trip.id } } });
  refreshSite(); return NextResponse.json(trip, { status: 201 });
}
