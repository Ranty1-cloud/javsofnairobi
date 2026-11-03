import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
const b = z.object({ type: z.enum(["submission", "comment"]), id: z.string(), action: z.enum(["approve", "reject"]) });
export async function POST(req: Request) {
  const u = await requireRole(["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"]);
  if (!u) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { type, id, action } = p.data;
  if (type === "comment") { if (action === "approve") await db.comment.update({ where: { id }, data: { approved: true } }); else await db.comment.delete({ where: { id } }); }
  else await db.submission.update({ where: { id }, data: { status: action === "approve" ? "APPROVED" : "REJECTED" } });
  await db.auditLog.create({ data: { actor: u.id, action: `moderate.${type}.${action}`, detail: { id } } });
  return NextResponse.json({ ok: true });
}
