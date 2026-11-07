

## Several vehicles on one event
An event can run on up to 8 vehicles (for example three Nganyas). In Admin > Events, press Edit on an event and use "Vehicles for this event" to add another vehicle, rename it, or remove it (only while none of its seats is booked or held). This works while the event is published. On the trip page customers get one tab per vehicle and pick seats in the vehicle they want; one booking stays inside one vehicle. Tickets and boarding lists show the vehicle name. Add new vehicle types in Admin > Vehicles.

Seat labels stay unique per event: the first vehicle uses plain labels (A1), later ones are prefixed (2-A1, 3-A1). The `TripVehicle` table and `TripSeat.tripVehicleId` come from `prisma/migrations/7_trip_vehicles`. Apply that SQL to the database before deploying code that uses it.
