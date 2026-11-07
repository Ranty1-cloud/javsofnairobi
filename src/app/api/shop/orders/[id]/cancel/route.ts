import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { cancelOrder } from "@/lib/shop";

// Customers can cancel only while nothing has been paid or submitted. After that, staff handle it.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Please log in to continue.", login: true }, { status: 401 });
  const o = await db.order.findFirst({ where: { id: params.id, userId: s.userId }, select: { id: true } });
  if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!(await cancelOrder(o.id, ["PENDING"], true))) return NextResponse.json({ error: "This order can't be cancelled here. Contact support." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
