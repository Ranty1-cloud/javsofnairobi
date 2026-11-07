import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { limited, clientIp } from "@/lib/ratelimit";
import { deliveryFee, expireStaleOrders, orderRef } from "@/lib/shop";
import { MAX_LINES, MAX_QTY, normalizePhone } from "@/lib/shop-constants";

class ShopError extends Error {}
const body = z.object({
  items: z.array(z.object({ variantId: z.string().min(5).max(40), qty: z.number().int().min(1).max(MAX_QTY) })).min(1).max(MAX_LINES),
  name: z.string().trim().min(2).max(80), phone: z.string().max(30),
  fulfilment: z.enum(["PICKUP", "DELIVERY"]), address: z.string().trim().max(300).optional(),
});

// Place an order. Needs an account. Prices and stock are read from the database here; the browser's bag is never trusted.
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Please log in or create an account to order.", login: true }, { status: 401 });
  if (limited("shop:" + s.userId, 6) || limited("shopip:" + clientIp(req), 30)) return NextResponse.json({ error: "Too many attempts, try again in a minute." }, { status: 429 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  const phone = normalizePhone(p.data.phone);
  if (!phone) return NextResponse.json({ error: "Enter a valid Kenyan mobile number, e.g. 0712 345 678." }, { status: 400 });
  let delivery = 0, address: string | null = null;
  if (p.data.fulfilment === "DELIVERY") {
    const fee = await deliveryFee();
    if (fee === null) return NextResponse.json({ error: "Delivery is not available right now. Please choose pickup." }, { status: 400 });
    if (!p.data.address || p.data.address.length < 5) return NextResponse.json({ error: "Enter your delivery address." }, { status: 400 });
    delivery = fee; address = p.data.address;
  }
  const qtyBy = new Map<string, number>(); // the same item added twice becomes one line
  for (const i of p.data.items) qtyBy.set(i.variantId, (qtyBy.get(i.variantId) ?? 0) + i.qty);
  await expireStaleOrders(); // frees stock from old unpaid orders before we check availability

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const order = await db.$transaction(async tx => {
        const variants = await tx.productVariant.findMany({ where: { id: { in: [...qtyBy.keys()] } }, include: { product: true } });
        if (variants.length !== qtyBy.size || variants.some(v => !v.product.active)) throw new ShopError("An item in your bag is no longer available. Please refresh your bag.");
        let subtotal = 0;
        for (const v of variants) {
          const qty = qtyBy.get(v.id)!;
          const taken = await tx.productVariant.updateMany({ where: { id: v.id, stock: { gte: qty } }, data: { stock: { decrement: qty } } }); // atomic: two buyers can't take the last one
          if (taken.count !== 1) throw new ShopError(`Sorry, ${v.product.name} (${v.color}, ${v.size}) is sold out or has fewer than ${qty} left.`);
          subtotal += v.product.priceKes * qty;
        }
        return tx.order.create({ data: { reference: orderRef(), userId: s.userId, name: p.data.name, phone, fulfilment: p.data.fulfilment, address, subtotalKes: subtotal, deliveryKes: delivery, totalKes: subtotal + delivery,
          items: { create: variants.map(v => ({ variantId: v.id, productName: v.product.name, color: v.color, size: v.size, qty: qtyBy.get(v.id)!, unitKes: v.product.priceKes })) } } });
      });
      return NextResponse.json({ id: order.id, reference: order.reference }, { status: 201 });
    } catch (e) {
      if (e instanceof ShopError) return NextResponse.json({ error: e.message }, { status: 409 });
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue; // reference collision: try a new one
      console.error("shop order failed", e);
      return NextResponse.json({ error: "Could not place the order. Please try again." }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Could not place the order. Please try again." }, { status: 500 });
}
