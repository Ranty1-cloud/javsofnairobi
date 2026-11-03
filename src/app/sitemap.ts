import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { site } from "@/lib/format";
import { liveArticles } from "@/lib/queries";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trips, dests, arts] = await Promise.all([db.trip.findMany({ where: { published: true }, select: { slug: true } }), db.destination.findMany({ select: { slug: true } }), db.article.findMany({ where: liveArticles(), select: { slug: true, publishedAt: true } })]);
  const b = site();
  return [...["", "/trips", "/destinations", "/nganya", "/news", "/gallery", "/about", "/support"].map(p => ({ url: b + p })), ...trips.map(t => ({ url: `${b}/trips/${t.slug}` })), ...dests.map(d => ({ url: `${b}/destinations/${d.slug}` })), ...arts.map(a => ({ url: `${b}/news/${a.slug}`, lastModified: a.publishedAt ?? undefined }))];
}
