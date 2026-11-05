"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const LINKS = [["/admin", "Dashboard"], ["/admin/manage", "Trips & content"], ["/admin/site", "Homepage"], ["/admin/payments", "Payments"], ["/admin/moderation", "Moderation"], ["/admin/analytics", "Analytics"], ["/admin/scan", "Scan tickets"]] as const;
export default function AdminNav() {
  const path = usePathname() ?? "";
  return <nav className="adm-nav" aria-label="Admin">{LINKS.map(([href, label]) => <Link key={href} href={href} className={path === href || (href !== "/admin" && path.startsWith(href)) ? "on" : ""}>{label}</Link>)}</nav>;
}
