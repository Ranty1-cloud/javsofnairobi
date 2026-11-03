import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import Scanner from "@/components/Scanner";
export default async function Scan() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "SUPPORT"]))) redirect("/");
  return <main style={{ padding: "6vh 6vw" }}><h1>Boarding <span style={{ color: "#E50914" }}>Scanner</span></h1><Scanner /></main>;
}
