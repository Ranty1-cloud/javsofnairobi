"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LABEL: Record<string, string> = { SUPER_ADMIN: "Super Admin", ADMIN: "Administrator", BOOKING_MANAGER: "Booking Manager", CONTENT_EDITOR: "Content Editor", FINANCE_MANAGER: "Finance Manager", SUPPORT: "Customer Support" };

// Staff who open the public site get a one-tap way back to the dashboard. Customers and visitors never see it.
export default function StaffBar() {
  const path = usePathname(), [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    fetch("/api/auth/me", { cache: "no-store" }).then(r => (r.ok ? r.json() : null)).then(j => { if (!off && j?.role && j.role !== "CUSTOMER") setRole(j.role); }).catch(() => {});
    return () => { off = true; };
  }, []);
  if (!role || path.startsWith("/admin")) return null;
  return <Link href="/admin" className="staff-pill" aria-label="Back to the admin dashboard">← Back to admin<small>{LABEL[role] ?? "Staff"} view</small></Link>;
}
