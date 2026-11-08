import Link from "next/link";
import { db } from "@/lib/db";
import { expireStaleOrders } from "@/lib/shop";
import { BRAND_LABEL, COLOR_HEX, KIND_LABEL, KIND_PLURAL } from "@/lib/shop-constants";
import { ksh } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import { pageMeta, webPageLd, breadcrumbLd, graph } from "@/lib/seo";
import type { Prisma } from "@prisma/client";
export const dynamic = "force-dynamic";
const DESC = "Official Kiburi Nation and Javs of Nairobi merchandise: t-shirts, hoodies, caps and arm bands. Pay with M-Pesa.";
export const generateMetadata = ({ searchParams }: { searchParams: SP }) => pageMeta({ title: "Shop", description: DESC, path: "/shop", noindex: !!(searchParams.brand || searchParams.kind) });
type SP = { brand?: string; kind?: string };
export default async function Shop({ searchParams: sp }: { searchParams: SP }) {
  await expireStaleOrders(); // unpaid orders give their stock back
  const where: Prisma.ProductWhereInput = { active: true };
  const brand = sp.brand && sp.brand in BRAND_LABEL ? (sp.brand as "KIBURI_NATION" | "JAVS_OF_NAIROBI") : undefined, kind = sp.kind && sp.kind in KIND_LABEL ? (sp.kind as "TSHIRT" | "HOODIE" | "CAP" | "ARMBAND") : undefined;
  if (brand) where.brand = brand;
  if (kind) where.kind = kind;
  const products = await db.product.findMany({ where, orderBy: [{ brand: "asc" }, { createdAt: "desc" }], include: { variants: { select: { color: true, stock: true } } } });
  const href = (b?: string, k?: string) => `/shop${b || k ? "?" : ""}${[b && `brand=${b}`, k && `kind=${k}`].filter(Boolean).join("&")}`;
  const chip = (label: string, to: string, on: boolean) => <Link key={label} href={to} className={`chip${on ? " on" : ""}`}>{label}</Link>;
  return (
    <>
      <JsonLd data={graph(webPageLd({ path: "/shop", name: "Shop", description: DESC, type: "CollectionPage" }), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }]))} />
      <h1>Official <span className="red">merch</span></h1>
      <p className="mut">Kiburi Nation and Javs of Nairobi gear. Pay with M-Pesa, collect at Nairobi or get it delivered.</p>
      <div className="chips" aria-label="Brand">{chip("All brands", href(undefined, kind), !brand)}{Object.entries(BRAND_LABEL).map(([k, v]) => chip(v, href(k, kind), brand === k))}</div>
      <div className="chips" aria-label="Type">{chip("Everything", href(brand, undefined), !kind)}{Object.entries(KIND_PLURAL).map(([k, v]) => chip(v, href(brand, k), kind === k))}</div>
      <div className="pgrid">
        {products.map(p => {
          const left = p.variants.reduce((s, v) => s + v.stock, 0), colors = [...new Set(p.variants.filter(v => v.stock > 0).map(v => v.color))];
          return (
            <article key={p.id} className="pcard">
              <Link href={`/shop/${p.slug}`} className="pcard-img" aria-label={p.name}>{p.imageUrl ? <img src={p.imageUrl} alt={`${p.name}, ${BRAND_LABEL[p.brand]}`} loading="lazy" decoding="async" /> : <div className="pcard-ph">{p.name}</div>}</Link>
              <div className="pcard-body">
                <span className="mut" style={{ fontSize: ".78rem", letterSpacing: ".12em", textTransform: "uppercase" }}>{BRAND_LABEL[p.brand]} · {KIND_LABEL[p.kind]}</span>
                <h3><Link href={`/shop/${p.slug}`}>{p.name}</Link></h3>
                <div className="dots" aria-label={`Colours: ${colors.join(", ") || "none"}`}>{colors.map(c => <span key={c} className="dot" title={c} style={{ background: COLOR_HEX[c] ?? "#888" }} />)}</div>
                <div className="tfoot"><div className="price">{ksh(p.priceKes)}</div>{left > 0 ? <Link className="btn sm" href={`/shop/${p.slug}`}>Choose</Link> : <span className="badge amber">Sold out</span>}</div>
              </div>
            </article>
          );
        })}
        {!products.length && <div className="empty">{brand || kind ? "Nothing matches that filter. " : "Merchandise is coming soon. "}{(brand || kind) && <Link className="red" href="/shop">Show everything</Link>}</div>}
      </div>
    </>
  );
}
