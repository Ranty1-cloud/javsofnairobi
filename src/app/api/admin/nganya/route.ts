import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { refreshSite } from "@/lib/refresh";
const ROLES = ["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"] as const;
const fields = { name: z.string().min(2).max(80), crew: z.string().max(80).default(""), bio: z.string().min(3).max(3000), imageUrl: z.string().url().nullable().optional() };

export async function POST(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object(fields).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Add a name and a short description." }, { status: 400 });
  const { imageUrl, crew, ...rest } = p.data;
  const row = await db.nganyaProfile.create({ data: { ...rest, crew: crew || null, imageUrl: imageUrl ?? null } });
  await db.auditLog.create({ data: { actor: u.id, action: "nganya.create", detail: { id: row.id } } });
  refreshSite(); return NextResponse.json(row, { status: 201 });
}

export async function PATCH(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ id: z.string(), ...fields }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Check the fields and try again." }, { status: 400 });
  const { id, imageUrl, crew, ...rest } = p.data;
  await db.nganyaProfile.update({ where: { id }, data: { ...rest, crew: crew || null, imageUrl: imageUrl ?? null } });
  await db.auditLog.create({ data: { actor: u.id, action: "nganya.update", detail: { id } } });
  refreshSite(); return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const u = await requireRole([...ROLES]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  await db.nganyaProfile.deleteMany({ where: { id } });
  await db.auditLog.create({ data: { actor: u.id, action: "nganya.delete", detail: { id } } });
  refreshSite(); return NextResponse.json({ ok: true });
}
