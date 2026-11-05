import type { ReactNode } from "react";
import AdminNav from "@/components/AdminNav";
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="adm"><aside className="adm-side"><p className="eyebrow">Admin</p><AdminNav /></aside><div className="adm-main">{children}</div></div>;
}
