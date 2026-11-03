import Link from "next/link";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function Trips() {
  const trips = await db.trip.findMany({ where: { published: true, departsAt: { gt: new Date() } }, orderBy: { departsAt: "asc" }, include: { destination: true, _count: { select: { seats: { where: { status: "AVAILABLE" } } } } } });
  return (
    <main style={{ padding: "6vh 8vw" }}>
      <h1>Trips &amp; Adventures</h1>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
        {trips.map(t => (
          <Link key={t.id} href={`/trips/${t.slug}`} style={{ background: "#111", border: "1px solid #292929", borderRadius: 14, padding: 20, color: "#fff", textDecoration: "none" }}>
            <small style={{ color: "#E50914" }}>{t.category}{t.isSample && " · SAMPLE"}</small>
            <h3>{t.title}</h3>
            <p style={{ color: "#A1A1A1" }}>{t.destination.name} · {t.departsAt.toLocaleDateString("en-KE")}</p>
            <p>From <b>KSh {t.priceKes.toLocaleString()}</b> · {t._count.seats} seats left</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
