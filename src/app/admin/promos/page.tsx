import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import PromoManager from "@/components/PromoManager";
export const metadata = { title: "Promo codes", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Promos() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "FINANCE_MANAGER"]))) redirect("/admin");
  const rows = await db.promoCode.findMany({ orderBy: [{ active: "desc" }, { code: "asc" }] });
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Marketing</p><h1>Promo <span className="red">codes</span></h1><p className="mut" style={{ margin: 0 }}>Discounts are checked and applied on the server at checkout, never from the browser.</p></div></header>
      <PromoManager promos={rows.map(r => ({ id: r.id, code: r.code, percentOff: r.percentOff, used: r.used, maxUses: r.maxUses, expiresAt: r.expiresAt?.toISOString() ?? null, active: r.active }))} />
    </main>
  );
}
