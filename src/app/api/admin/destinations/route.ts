import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { refreshSite } from "@/lib/refresh";
import { isCounty, placeOf } from "@/lib/kenya";
const ROLES = ["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"] as const;
const details = { description: z.string().max(5000).default(""), imageUrl: z.string().url().nullable().optional(), travelTime: z.string().max(80).default(""), budgetNote: z.string().max(120).default(""), activities: z.string().max(300).default(""), tips: z.string().max(600).default("") };
const place = { county: z.string().refine(isCounty, "Choose a county"), town: z.string().max(80).default("") };

export async function POST(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ ...place, ...details }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { county, town, imageUrl, ...rest } = p.data, pl = placeOf(county, town);
  if (await db.destination.findUnique({ where: { slug: pl.slug }, select: { id: true } })) return NextResponse.json({ error: "That place is already in the list. Edit it instead." }, { status: 409 });
  const row = await db.destination.create({ data: { slug: pl.slug, name: pl.name, region: pl.region, imageUrl: imageUrl ?? null, ...rest } });
  await db.auditLog.create({ data: { actor: u.id, action: "destination.create", detail: { id: row.id } } });
  refreshSite(); return NextResponse.json(row, { status: 201 });
}

// Edits the write-up and photo. The place itself (county/town) is not changed here: add the right place instead, so links stay stable.
export async function PATCH(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ id: z.string(), ...details }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { id, imageUrl, ...rest } = p.data;
  await db.destination.update({ where: { id }, data: { ...rest, imageUrl: imageUrl ?? null } });
  await db.auditLog.create({ data: { actor: u.id, action: "destination.update", detail: { id } } });
  refreshSite(); return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const d = await db.destination.findUnique({ where: { id }, select: { id: true, _count: { select: { trips: true } } } });
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (d._count.trips > 0) return NextResponse.json({ error: `${d._count.trips} event${d._count.trips === 1 ? " is" : "s are"} still set to this place. Move them to another county or town first.` }, { status: 409 });
  await db.destination.delete({ where: { id } });
  await db.auditLog.create({ data: { actor: u.id, action: "destination.delete", detail: { id } } });
  refreshSite(); return NextResponse.json({ ok: true });
}
