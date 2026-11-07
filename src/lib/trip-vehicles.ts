import { db } from "./db";
import { layoutSeats, type Layout } from "./layout";
export const MAX_VEHICLES_PER_EVENT = 8;
// Adds a vehicle and all its seats to an event, at any time (also after the event is published).
// Seat labels must stay unique per event, so the first vehicle uses plain labels (A1) and later ones a prefix (2-A1, 3-A1…).
export async function addVehicleToTrip(tripId: string, vehicleId: string, o: { name?: string; priceKes: number; premiumPriceKes?: number }) {
  const veh = await db.vehicle.findUnique({ where: { id: vehicleId } });
  if (!veh) throw new Error("Unknown vehicle");
  const existing = await db.tripVehicle.findMany({ where: { tripId }, select: { position: true, name: true }, orderBy: { position: "desc" } });
  if (existing.length >= MAX_VEHICLES_PER_EVENT) throw new Error(`An event can have up to ${MAX_VEHICLES_PER_EVENT} vehicles`);
  const position = existing.length ? existing[0].position + 1 : 0, prefix = position === 0 ? "" : `${position + 1}-`;
  const typed = (o.name ?? "").trim(), base = typed || veh.name;
  const name = existing.some(e => e.name.toLowerCase() === base.toLowerCase()) ? (typed ? `${base} (${position + 1})` : `${base} ${position + 1}`) : base;
  const seatList = layoutSeats(veh.layout as unknown as Layout);
  return db.$transaction(async tx => {
    const tv = await tx.tripVehicle.create({ data: { tripId, vehicleId, name, prefix, position } });
    await tx.tripSeat.createMany({ data: seatList.map(s => ({ tripId, tripVehicleId: tv.id, label: prefix + s.label, priceKes: s.rowIndex === 0 && o.premiumPriceKes ? o.premiumPriceKes : o.priceKes })) });
    return tv;
  });
}
