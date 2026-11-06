import type { ReactNode } from "react";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand"><span className="disp">JAVS</span><small>Control room</small></div>
        <AdminNav />
        <Link href="/" className="adm-back">← View live site</Link>
      </aside>
      <div className="adm-main">{children}</div>
    </div>
  );
}
