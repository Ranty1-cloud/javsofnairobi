import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { deliveryFee } from "@/lib/shop";
import { SHOP_ROLES } from "@/lib/shop-constants";
import ShopProductsManager from "@/components/ShopProductsManager";
export const metadata = { title: "Shop products", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function AdminShop() {
  if (!(await requireRole(SHOP_ROLES))) redirect("/admin");
  const [rows, fee] = await Promise.all([db.product.findMany({ orderBy: [{ brand: "asc" }, { createdAt: "desc" }], include: { variants: true } }), deliveryFee()]);
  return (
    <main className="adm-page">
      <header className="adm-head"><div><p className="eyebrow">Content</p><h1>Shop <span className="red">products</span></h1><p className="mut" style={{ margin: 0 }}>Kiburi Nation and Javs of Nairobi merch: t-shirts, hoodies, caps and arm bands in white, black and red.</p></div></header>
      <ShopProductsManager deliveryFee={fee} products={rows.map(p => ({ id: p.id, name: p.name, brand: p.brand, kind: p.kind, description: p.description, priceKes: p.priceKes, imageUrl: p.imageUrl, active: p.active, stock: Object.fromEntries(p.variants.map(v => [`${v.color}|${v.size}`, v.stock])) }))} />
    </main>
  );
}
