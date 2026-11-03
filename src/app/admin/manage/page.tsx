import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, STAFF } from "@/lib/session";
import AdminForms from "@/components/AdminForms";
export const dynamic = "force-dynamic";
export default async function Manage() {
  if (!(await requireRole(STAFF))) redirect("/");
  const [dest, veh] = await Promise.all([db.destination.findMany({ select: { id: true, name: true } }), db.vehicle.findMany({ select: { id: true, name: true } })]);
  return <main className="wrap" style={{ maxWidth: 720 }}><h1>Manage</h1><p className="mut">Each action is limited by role on the server; a form you lack permission for returns Forbidden.</p><AdminForms dest={dest} veh={veh} /></main>;
}
