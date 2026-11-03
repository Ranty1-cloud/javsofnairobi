import { db } from "./db";
// A promo use is claimed when a booking is created and given back if that booking never completes.
export async function releasePromo(code?: string | null) {
  if (!code) return;
  await db.promoCode.updateMany({ where: { code, used: { gt: 0 } }, data: { used: { decrement: 1 } } });
}
