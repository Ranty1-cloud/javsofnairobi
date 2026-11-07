import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import type { Layout } from "@/lib/layout";
import VehiclesManager, { type FleetRow } from "@/components/VehiclesManager";
export const metadata = { title: "Vehicles", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Vehicles() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"]))) redirect("/admin");
  const list = await db.vehicle.findMany({ orderBy: { capacity: "asc" }, include: { _count: { select: { trips: true, onTrips: true } } } });
  const rows: FleetRow[] = list.map(v => { const l = v.layout as unknown as Layout; return { id: v.id, name: v.name, capacity: v.capacity, shape: l.plan ? "custom seat plan" : `${l.rows.length} rows of ${l.cols.length}`, events: Math.max(v._count.trips, v._count.onTrips) }; });
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Content</p><h1>Your <span className="red">vehicles</span></h1><p className="mut" style={{ margin: 0 }}>The vehicles you run. Add as many as you like, then put one or several on each event.</p></div></header>
      <VehiclesManager rows={rows} />
    </main>
  );
}
