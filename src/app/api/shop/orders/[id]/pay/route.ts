import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { limited, clientIp } from "@/lib/ratelimit";
import { cleanPayerName, isPayerName, PAYER_NAME_HELP } from "@/lib/payer-name";

const b = z.object({ code: z.string().regex(/^[A-Z0-9]{10}$/, "Enter the 10-character M-Pesa code"), payerName: z.string().refine(isPayerName, PAYER_NAME_HELP) });
// The customer paid to the Till and sends us the M-Pesa code and the name on their M-Pesa. Staff confirm it in Admin > Shop orders.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Please log in to continue.", login: true }, { status: 401 });
  if (limited("shoppay:" + s.userId, 8) || limited("shoppayip:" + clientIp(req), 30)) return NextResponse.json({ error: "Too many attempts, try again in a minute." }, { status: 429 });
  const p = b.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  try {
    const r = await db.order.updateMany({ where: { id: params.id, userId: s.userId, status: "PENDING" }, data: { mpesaCode: p.data.code, payerName: cleanPayerName(p.data.payerName) } });
    if (r.count !== 1) return NextResponse.json({ error: "This order can't take a payment code (it may be paid or cancelled)." }, { status: 409 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return NextResponse.json({ error: "That M-Pesa code has already been used." }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}
