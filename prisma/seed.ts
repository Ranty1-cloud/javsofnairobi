import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
// Seat layouts: rows are letters, cols are seat numbers. The seat map puts the aisle in the middle of each row.
const letters = (n: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
const VEHICLES = [
  { name: "14-seater Nganya", capacity: 14, layout: { rows: letters(7), cols: [1, 2] } },
  { name: "18-seater Nganya", capacity: 18, layout: { rows: letters(6), cols: [1, 2, 3] } },
  { name: "33-seater Nganya Bus", capacity: 33, layout: { rows: letters(11), cols: [1, 2, 3] } },
];
// Safe to run more than once: adds only the vehicles that are missing. No demo trips or destinations are created.
async function main() {
  for (const v of VEHICLES) if (!(await db.vehicle.findFirst({ where: { name: v.name } }))) await db.vehicle.create({ data: v });
}
main().finally(() => db.$disconnect());
