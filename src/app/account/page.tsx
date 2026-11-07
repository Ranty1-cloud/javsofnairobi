import Link from "next/link";
import { fmtDateTime } from "@/lib/format";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { CancelButton, LogoutButton } from "@/components/BookingButtons";
export const dynamic = "force-dynamic";
export default async function Account() {
  const s = await getSession();
  if (!s) redirect("/login");
  const u = await db.user.findFirst({ where: { id: s.userId, deletedAt: null }, include: { bookings: { orderBy: { createdAt: "desc" }, include: { trip: true, seats: true, tickets: true, payments: true } } } });
  if (!u) redirect("/login");
  const pts = await db.loyaltyEntry.aggregate({ where: { userId: u.id }, _sum: { points: true } });
  return (
    <main className="wrap">
      <h1>My <span style={{ color: "#E50914" }}>Bookings</span></h1>
      <p className="mut">{u.name} · {u.email} {u.role !== "CUSTOMER" && <Link href="/admin">· Admin</Link>}</p><LogoutButton /><p><Link href="/shop/orders" className="mut">My merch orders</Link></p><p>Loyalty points: <b>{pts._sum.points ?? 0}</b> <span className="mut">(1 point per KSh 100 paid; rewards coming soon)</span></p>
      <div className="grid" style={{ marginTop: 20 }}>
        {u.bookings.map(b => (
          <div key={b.id} className="card">
            <small style={{ color: b.status === "CONFIRMED" ? "#fff" : "#d9a400" }}>{b.status}</small>
            <h3>{b.trip.title}</h3>
            <p className="mut">{fmtDateTime(b.trip.departsAt)} · {b.reference}</p>
            <p>KSh {b.totalKes.toLocaleString()} · {b.payments.map(p => p.status).join(", ") || "no payment"}</p>
            <p><Link href={`/booking/${b.id}`} className="mut">Details</Link>{b.status === "CONFIRMED" && b.tickets.length > 0 && <a href={`/api/bookings/${b.id}/pdf`} className="mut" style={{ marginLeft: 8 }}>All tickets (PDF)</a>}{b.tickets.map(t => <Link key={t.id} href={`/ticket/${t.token}`} className="btn" style={{ marginLeft: 8 }}>Ticket {b.seats.find(x => x.id === t.seatId)?.label}</Link>)}</p>
            {b.status === "PENDING" && <CancelButton id={b.id} />}
          </div>
        ))}
        {!u.bookings.length && <p className="mut">No bookings yet. <Link href="/trips">Browse trips</Link></p>}
      </div>
    </main>
  );
}
