import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE } from "@/lib/seo";
import { liveArticles } from "@/lib/queries";
export const dynamic = "force-dynamic";
// Only public, indexable pages. lastModified is set only where the database really records a date (article publish time);
// everything else omits it rather than guessing. One file is plenty: the protocol limit is 50,000 URLs, enforced below.
const PAGES = ["", "/trips", "/destinations", "/nganya", "/news", "/gallery", "/shop", "/how-to-book", "/about", "/support", "/privacy"];
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trips, dests, arts, products] = await Promise.all([
    db.trip.findMany({ where: { published: true, departsAt: { gt: new Date() } }, select: { slug: true } }),
    db.destination.findMany({ select: { slug: true } }),
    db.article.findMany({ where: liveArticles(), select: { slug: true, publishedAt: true } }),
    db.product.findMany({ where: { active: true }, select: { slug: true } }),
  ]);
  const out = new Map<string, MetadataRoute.Sitemap[number]>();
  const add = (path: string, lastModified?: Date | null) => { const url = SITE + (path || "/"); if (!out.has(url)) out.set(url, { url, ...(lastModified ? { lastModified } : {}) }); };
  PAGES.forEach(p => add(p));
  trips.forEach(t => add(`/trips/${t.slug}`));
  dests.forEach(d => add(`/destinations/${d.slug}`));
  arts.forEach(a => add(`/news/${a.slug}`, a.publishedAt));
  products.forEach(p => add(`/shop/${p.slug}`));
  return [...out.values()].slice(0, 50000);
}
