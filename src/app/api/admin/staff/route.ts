import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "CONTENT_EDITOR", "FINANCE_MANAGER", "SUPPORT"] as const;
const role = z.enum(STAFF_ROLES);
// POST: invite a new staff member by email. Supabase emails them an invite link (template "Invite user"); they choose a password on /reset.
export async function POST(req: Request) {
  const me = await requireRole(["SUPER_ADMIN"]);
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ email: z.string().email().max(160), name: z.string().min(2).max(80), role }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  const { data, error } = await supabaseAdmin().auth.admin.inviteUserByEmail(email, { data: { name: p.data.name } });
  if (error || !data.user) return NextResponse.json({ error: error?.message ?? "Could not send the invite" }, { status: 400 });
  await db.user.upsert({ where: { email }, update: { authId: data.user.id, name: p.data.name, role: p.data.role as never }, create: { authId: data.user.id, email, name: p.data.name, role: p.data.role as never } });
  await db.auditLog.create({ data: { actor: me.id, action: "staff.invited", detail: { email, role: p.data.role } } });
  return NextResponse.json({ ok: true });
}
// PATCH: change the role of an existing account (CUSTOMER demotes a staff member). You cannot change your own role.
export async function PATCH(req: Request) {
  const me = await requireRole(["SUPER_ADMIN"]);
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = z.object({ email: z.string().email(), role: z.enum([...STAFF_ROLES, "CUSTOMER"]) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (email === me.email) return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
  const r = await db.user.updateMany({ where: { email, deletedAt: null }, data: { role: p.data.role as never } });
  if (!r.count) return NextResponse.json({ error: "No such account" }, { status: 404 });
  await db.auditLog.create({ data: { actor: me.id, action: "staff.role_changed", detail: { email, role: p.data.role } } });
  return NextResponse.json({ ok: true });
}
