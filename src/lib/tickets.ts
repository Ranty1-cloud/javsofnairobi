import { randomBytes } from "crypto";
import { db } from "./db";
// Idempotent: seatId is unique, so a repeated payment callback cannot create duplicate tickets.
export async function issueTickets(bookingId: string) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { seats: true, user: true, passengers: true } });
  if (!b || b.status !== "CONFIRMED") return 0;
  const name = b.user?.name ?? b.guestEmail ?? "Guest";
  const r = await db.ticket.createMany({ data: b.seats.map(s => ({ token: randomBytes(24).toString("base64url"), bookingId, seatId: s.id, passengerName: b.passengers.find(x => x.label === s.label)?.name ?? name })), skipDuplicates: true });
  return r.count;
}
