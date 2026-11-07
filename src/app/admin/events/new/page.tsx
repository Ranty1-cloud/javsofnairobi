import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import NewEventForm from "@/components/NewEventForm";
export const metadata = { title: "New event", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function NewEvent() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER"]))) redirect("/admin");
  const vehicles = await db.vehicle.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Content</p><h1>New <span className="red">event</span></h1><p className="mut" style={{ margin: 0 }}>Pick the county and town, set the date and price, and publish when it is ready.</p></div><div className="adm-tools"><Link className="btn sm ghost" href="/admin/events">← All events</Link></div></header>
      {vehicles.length ? <NewEventForm vehicles={vehicles} /> : <section className="panel"><p className="mut" style={{ margin: 0 }}>No vehicles are set up yet. A vehicle is needed to create seats for an event.</p></section>}
    </main>
  );
}
