import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
const ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"] as const;
const letters = (n: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));

// Adds a vehicle type to the fleet: a plain grid of rows and seats per row, with the aisle in the middle.
export async function POST(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ name: z.string().trim().min(2).max(60), rows: z.number().int().min(1).max(20), perRow: z.number().int().min(1).max(6) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Enter a name, the number of rows (1 to 20) and seats per row (1 to 6)." }, { status: 400 });
  if (await db.vehicle.findFirst({ where: { name: { equals: p.data.name, mode: "insensitive" } } })) return NextResponse.json({ error: "A vehicle with that name already exists." }, { status: 409 });
  const row = await db.vehicle.create({ data: { name: p.data.name, capacity: p.data.rows * p.data.perRow, layout: { rows: letters(p.data.rows), cols: Array.from({ length: p.data.perRow }, (_, i) => i + 1) } } });
  await db.auditLog.create({ data: { actor: u.id, action: "vehicle.create", detail: { id: row.id } } });
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const v = await db.vehicle.findUnique({ where: { id }, select: { id: true, _count: { select: { trips: true, onTrips: true } } } });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (v._count.trips + v._count.onTrips > 0) return NextResponse.json({ error: "This vehicle is used by an event, so it cannot be deleted." }, { status: 409 });
  await db.vehicle.delete({ where: { id } });
  await db.auditLog.create({ data: { actor: u.id, action: "vehicle.delete", detail: { id } } });
  return NextResponse.json({ ok: true });
}
