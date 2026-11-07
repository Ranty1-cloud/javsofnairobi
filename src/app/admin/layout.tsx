import type { ReactNode } from "react";
import AdminNav from "@/components/AdminNav";
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand"><span className="disp">JAVS</span><small>Control room</small></div>
        <AdminNav />
        <a href="/" target="_blank" rel="noopener" className="adm-back">View live site ↗</a>
      </aside>
      <div className="adm-main">{children}</div>
    </div>
  );
}
