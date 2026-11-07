import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductBuy from "@/components/ProductBuy";
import { BRAND_LABEL, KIND_LABEL } from "@/lib/shop-constants";
import { ksh } from "@/lib/format";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await db.product.findFirst({ where: { slug: params.slug, active: true }, select: { name: true, brand: true } });
  return p ? { title: `${p.name} · ${BRAND_LABEL[p.brand]}` } : { title: "Shop" };
}
export default async function Product({ params }: { params: { slug: string } }) {
  const p = await db.product.findFirst({ where: { slug: params.slug, active: true }, include: { variants: { orderBy: { size: "asc" } } } });
  if (!p) notFound();
  return (
    <>
      <p className="mut"><Link href="/shop">← All merch</Link></p>
      <div className="pdp">
        <div className="pdp-img">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} /> : <div className="pcard-ph">{p.name}</div>}</div>
        <div>
          <span className="mut" style={{ letterSpacing: ".14em", textTransform: "uppercase", fontSize: ".8rem" }}>{BRAND_LABEL[p.brand]} · {KIND_LABEL[p.kind]}</span>
          <h1 style={{ margin: "6px 0 8px" }}>{p.name}</h1>
          <div className="price" style={{ fontSize: "1.6rem", marginBottom: 14 }}>{ksh(p.priceKes)}</div>
          {p.description && <p className="prose" style={{ whiteSpace: "pre-line" }}>{p.description}</p>}
          <ProductBuy product={{ slug: p.slug, name: p.name, priceKes: p.priceKes, imageUrl: p.imageUrl }} variants={p.variants.map(v => ({ id: v.id, color: v.color, size: v.size, stock: v.stock }))} />
        </div>
      </div>
    </>
  );
}
