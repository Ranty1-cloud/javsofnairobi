import { db } from "./db";
import { placeOf, slugify } from "./kenya";
// Finds or creates the destination for a county and optional town, so staff never type slugs or ids.
export async function resolveDestination(county: string, town: string) {
  const p = placeOf(county, town);
  const found = await db.destination.findUnique({ where: { slug: p.slug }, select: { id: true } });
  if (found) return found.id;
  const row = await db.destination.create({ data: { slug: p.slug, name: p.name, region: p.region, description: "" }, select: { id: true } });
  return row.id;
}
// Adds -2, -3 … until the slug is free.
export async function uniqueSlug(title: string, taken: (slug: string) => Promise<boolean>) {
  const base = slugify(title) || "item";
  let s = base, n = 2;
  while (await taken(s)) s = `${base}-${n++}`;
  return s;
}
