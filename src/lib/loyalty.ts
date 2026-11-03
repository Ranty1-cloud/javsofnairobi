import { db } from "./db";
const KES_PER_POINT = 100; // assumption: set the real earning rule once decided
export async function awardPoints(bookingId: string) {
  const b = await db.booking.findUnique({ where: { id: bookingId } });
  if (!b?.userId || b.status !== "CONFIRMED") return;
  await db.loyaltyEntry.createMany({ data: [{ userId: b.userId, bookingId, points: Math.floor(b.totalKes / KES_PER_POINT) }], skipDuplicates: true }); // unique bookingId: never double-awarded
}
