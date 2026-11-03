import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import SeatMap from "@/components/SeatMap";
import SubmitForm from "@/components/SubmitForm";
export const dynamic = "force-dynamic";
export default async function TripPage({ params }: { params: { slug: string } }) {
  const trip = await db.trip.findUnique({ where: { slug: params.slug }, include: { seats: { orderBy: { label: "asc" } } } });
  if (!trip || !trip.published) notFound();
  const now = new Date();
  const seats = trip.seats.map(s => ({ label: s.label, priceKes: s.priceKes, status: s.status === "RESERVED" && s.heldUntil && s.heldUntil < now ? "AVAILABLE" : s.status }));
  return (
    <main style={{ padding: "6vh 8vw" }}>
      <h1>{trip.title}</h1>
      <p style={{ color: "#A1A1A1" }}>{trip.departsAt.toLocaleString("en-KE")} · Meet at {trip.meetingPoint}</p>
      <SeatMap tripId={trip.id} seats={seats} fee={trip.bookingFeeKes} />
      {seats.every(s => s.status !== "AVAILABLE") && <><h3>Fully booked</h3><SubmitForm endpoint="/api/waitlist" extra={{ tripId: trip.id }} fields={["contact"]} label="Join waitlist (phone or email)" /></>}
    </main>
  );
}
