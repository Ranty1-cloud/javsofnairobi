import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { limited, clientIp } from "@/lib/ratelimit";
import { cleanPayerName, isPayerName, PAYER_NAME_HELP } from "@/lib/payer-name";
const b = z.object({ id: z.string(), code: z.string().regex(/^[A-Z0-9]{10}$/, "Enter the 10-character M-Pesa code"), payerName: z.string().refine(isPayerName, PAYER_NAME_HELP) });
export async function POST(req: Request) {
  if (limited("m:" + clientIp(req), 6)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const p = b.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: p.error.issues[0].message }, { status: 400 });
  const pay = await db.payment.findFirst({ where: { bookingId: p.data.id, provider: "mpesa_manual", status: "PENDING" } });
  if (!pay) return NextResponse.json({ error: "No pending manual payment" }, { status: 404 });
  try { await db.payment.update({ where: { id: pay.id }, data: { providerRef: p.data.code, payerName: cleanPayerName(p.data.payerName) } }); }
  catch { return NextResponse.json({ error: "That code was already used for another booking" }, { status: 409 }); }
  await db.auditLog.create({ data: { action: "manual.code_submitted", detail: { bookingId: p.data.id } } });
  return NextResponse.json({ ok: true }); // staff verify against the M-Pesa statement; submitting a code never confirms anything
}
