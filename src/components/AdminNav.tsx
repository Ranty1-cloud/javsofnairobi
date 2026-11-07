"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ICON: Record<string, string> = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  route: "M5 19a2 2 0 100-4 2 2 0 000 4zM19 9a2 2 0 100-4 2 2 0 000 4zM7 17h6a4 4 0 004-4V9M12 7H9a4 4 0 00-4 4v4",
  image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M9 9.5a.5.5 0 100-1 .5.5 0 000 1z",
  card: "M2 6h20v12H2zM2 10h20M6 15h4",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  scan: "M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10",
  users: "M16 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 10a4 4 0 100-8 4 4 0 000 8zM22 20v-2a4 4 0 00-3-3.9M16 2.1a4 4 0 010 7.8",
  tag: "M3 12V3h9l9 9-9 9zM7.5 7.5h.01",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  log: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7",
  calendar: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4",
  photos: "M4 4h16v16H4zM8 15l3-3 4 4 2-2 3 3M8.5 8.5h.01",
};
const GROUPS: { title: string; links: [href: string, label: string, icon: keyof typeof ICON][] }[] = [
  { title: "Overview", links: [["/admin", "Dashboard", "grid"], ["/admin/analytics", "Analytics", "chart"]] },
  { title: "Content", links: [["/admin/events", "Events", "calendar"], ["/admin/gallery", "Gallery", "photos"], ["/admin/manage", "Create content", "route"], ["/admin/site", "Homepage photo", "image"]] },
  { title: "Operations", links: [["/admin/payments", "Payments", "card"], ["/admin/moderation", "Moderation", "shield"], ["/admin/scan", "Scan tickets", "scan"], ["/admin/boarding", "Boarding lists", "list"], ["/admin/waitlist", "Waitlists", "clock"]] },
  { title: "Growth & access", links: [["/admin/promos", "Promo codes", "tag"], ["/admin/staff", "Staff & roles", "users"], ["/admin/audit", "Audit log", "log"]] },
];
const Icon = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;

export default function AdminNav() {
  const path = usePathname() ?? "";
  return (
    <nav className="adm-nav" aria-label="Admin">
      {GROUPS.map(g => (
        <div className="adm-group" key={g.title}>
          <p className="adm-group-title">{g.title}</p>
          {g.links.map(([href, label, icon]) => {
            const on = path === href || (href !== "/admin" && path.startsWith(href));
            return <Link key={href} href={href} className={on ? "on" : ""} aria-current={on ? "page" : undefined}><Icon d={ICON[icon]} /><span>{label}</span></Link>;
          })}
        </div>
      ))}
    </nav>
  );
}
