import { db } from "./db";
const HOLD_MS = 10 * 60 * 1000;

// Atomic server-side hold: one conditional UPDATE, so two buyers can never win the same seat.
export async function holdSeats(tripId: string, labels: string[], holder: string) {
  const now = new Date();
  const until = new Date(now.getTime() + HOLD_MS);
  const res = await db.tripSeat.updateMany({
    where: {
      tripId, label: { in: labels },
      OR: [{ status: "AVAILABLE" }, { status: "RESERVED", heldUntil: { lt: now } }, { status: "RESERVED", heldBy: holder }],
    },
    data: { status: "RESERVED", heldBy: holder, heldUntil: until },
  });
  if (res.count !== labels.length) {
    await releaseSeats(tripId, labels, holder);
    throw new Error("One or more seats are no longer available");
  }
  return until;
}
export function releaseSeats(tripId: string, labels: string[], holder: string) {
  return db.tripSeat.updateMany({
    where: { tripId, label: { in: labels }, status: "RESERVED", heldBy: holder },
    data: { status: "AVAILABLE", heldBy: null, heldUntil: null },
  });
}
