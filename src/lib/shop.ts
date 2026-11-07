import { randomBytes } from "crypto";
import type { OrderStatus } from "@prisma/client";
import { db } from "./db";
import { DELIVERY_FEE_KEY, HOLD_HOURS } from "./shop-constants";

export const orderRef = () => "JVM" + randomBytes(4).toString("hex").slice(0, 6).toUpperCase();

// null = delivery is switched off (pickup only). Set in Admin > Shop products.
export async function deliveryFee() {
  const s = await db.siteSetting.findUnique({ where: { key: DELIVERY_FEE_KEY } });
  const n = s ? Number(s.value) : NaN;
  return Number.isInteger(n) && n >= 0 ? n : null;
}

// Cancels an order and gives its stock back, in one transaction. `from` guards the current status so it can never run twice.
export async function cancelOrder(id: string, from: OrderStatus[], onlyUnpaid = false) {
  return db.$transaction(async tx => {
    const r = await tx.order.updateMany({ where: { id, status: { in: from }, ...(onlyUnpaid ? { mpesaCode: null } : {}) }, data: { status: "CANCELLED" } });
    if (r.count !== 1) return false;
    const items = await tx.orderItem.findMany({ where: { orderId: id, variantId: { not: null } } });
    for (const it of items) await tx.productVariant.update({ where: { id: it.variantId! }, data: { stock: { increment: it.qty } } });
    return true;
  });
}

// Orders nobody has paid for (no M-Pesa code sent) free their stock after HOLD_HOURS. Called from the cron job and from the shop pages.
export async function expireStaleOrders() {
  const stale = await db.order.findMany({ where: { status: "PENDING", mpesaCode: null, createdAt: { lt: new Date(Date.now() - HOLD_HOURS * 3_600_000) } }, select: { id: true } });
  let n = 0;
  for (const o of stale) if (await cancelOrder(o.id, ["PENDING"], true)) n++;
  return n;
}
