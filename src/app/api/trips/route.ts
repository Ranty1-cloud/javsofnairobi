export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  const trips = await db.trip.findMany({ where: { published: true, departsAt: { gt: new Date() } }, orderBy: { departsAt: "asc" }, include: { destination: true, _count: { select: { seats: { where: { status: "AVAILABLE" } } } } } });
  return NextResponse.json(trips);
}
