import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductBuy from "@/components/ProductBuy";
import { BRAND_LABEL, KIND_LABEL } from "@/lib/shop-constants";
import { ksh } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { pageMeta, webPageLd, breadcrumbLd, productLd, graph, clip } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await db.product.findFirst({ where: { slug: params.slug, active: true }, select: { slug: true, name: true, brand: true, kind: true, description: true, imageUrl: true } });
  return p ? pageMeta({ title: `${p.name} · ${BRAND_LABEL[p.brand]}`, description: clip(p.description || `${p.name}: official ${BRAND_LABEL[p.brand]} ${KIND_LABEL[p.kind].toLowerCase()}. Pay with M-Pesa.`), path: `/shop/${p.slug}`, image: p.imageUrl }) : { title: "Shop" };
}
export default async function Product({ params }: { params: { slug: string } }) {
  const p = await db.product.findFirst({ where: { slug: params.slug, active: true }, include: { variants: { orderBy: { size: "asc" } } } });
  if (!p) notFound();
  const crumbs = [{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: p.name, path: `/shop/${p.slug}` }];
  const desc = clip(p.description || `${p.name}, official ${BRAND_LABEL[p.brand]} merchandise.`);
  return (
    <>
      <JsonLd data={graph(webPageLd({ path: `/shop/${p.slug}`, name: p.name, description: desc }), breadcrumbLd(crumbs), productLd({ slug: p.slug, name: p.name, brand: BRAND_LABEL[p.brand], description: p.description, priceKes: p.priceKes, imageUrl: p.imageUrl, inStock: p.variants.some(v => v.stock > 0) }))} />
      <Breadcrumbs items={crumbs} />
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
