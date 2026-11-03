import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const rows = ["A", "B", "C", "D"], cols = [1, 2, 3, 4];
// Everything seeded here is clearly marked as sample data (isSample / "Sample" in text). Replace it from the admin dashboard.
async function main() {
  const dest = await db.destination.upsert({ where: { slug: "naivasha" }, update: {}, create: { slug: "naivasha", name: "Naivasha", region: "Rift Valley", description: "Sample destination. Replace this with real details from the admin dashboard.", lat: -0.7172, lng: 36.4310 } });
  const veh = (await db.vehicle.findFirst()) ?? await db.vehicle.create({ data: { name: "16-seater Nganya", capacity: 16, layout: { rows, cols } } });
  const samples = [
    ["rong-sato-szn-2", "Rong Sato SZN 2", "Nganya event", "DAY", "1 day"],
    ["nairobi-night-adventure", "Nairobi Night Adventure", "Road trip", "OVERNIGHT", "Overnight"],
    ["rift-valley-weekend", "Rift Valley Adventure", "Road trip", "WEEKEND", "2 days"],
  ];
  for (const [i, [slug, title, category, tripType, durationLabel]] of samples.entries()) {
    if (await db.trip.findUnique({ where: { slug } })) continue;
    const t = await db.trip.create({ data: { slug, title, category, tripType, durationLabel, summary: "Sample trip for testing. Edit or delete it in the admin dashboard.", destinationId: dest.id, vehicleId: veh.id, departsAt: new Date(Date.now() + (7 + i * 7) * 864e5), meetingPoint: "Nairobi CBD (sample)", priceKes: 1500, bookingFeeKes: 100, published: true, isSample: true } });
    await db.tripSeat.createMany({ data: rows.flatMap(r => cols.map(c => ({ tripId: t.id, label: `${r}${c}`, priceKes: r === "A" ? 1800 : 1500 }))) });
  }
}
main().finally(() => db.$disconnect());
