-- An event can run on several vehicles (e.g. three Nganyas). Customers pick which vehicle to sit in.
-- Seat labels stay unique per event: the first vehicle uses plain labels (A1), later ones get a prefix (2-A1).
CREATE TABLE "TripVehicle" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT '',
  "prefix" TEXT NOT NULL DEFAULT '',
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TripVehicle_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TripVehicle_tripId_idx" ON "TripVehicle"("tripId");
ALTER TABLE "TripVehicle" ADD CONSTRAINT "TripVehicle_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripVehicle" ADD CONSTRAINT "TripVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TripSeat" ADD COLUMN "tripVehicleId" TEXT;
ALTER TABLE "TripSeat" ADD CONSTRAINT "TripSeat_tripVehicleId_fkey" FOREIGN KEY ("tripVehicleId") REFERENCES "TripVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing events: their current vehicle becomes the first vehicle and owns all their seats.
INSERT INTO "TripVehicle" ("id", "tripId", "vehicleId", "name", "prefix", "position")
SELECT 'c' || substr(md5(t."id" || 'tv0'), 1, 24), t."id", t."vehicleId", v."name", '', 0 FROM "Trip" t JOIN "Vehicle" v ON v."id" = t."vehicleId";
UPDATE "TripSeat" s SET "tripVehicleId" = tv."id" FROM "TripVehicle" tv WHERE tv."tripId" = s."tripId" AND tv."position" = 0;
