import { db } from "./db";

// Which events staff pinned to the top of the homepage. Stored in SiteSetting as a JSON list of trip ids, so no database migration is needed.
export const FEATURED_MAX = 6;
export async function readFeatured(): Promise<string[]> {
  const row = await db.siteSetting.findUnique({ where: { key: "featuredTrips" } });
  try {
    const raw = JSON.parse(row?.value ?? "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(0, FEATURED_MAX) : [];
  } catch { return []; }
}
export const saveFeatured = (ids: string[]) => db.siteSetting.upsert({ where: { key: "featuredTrips" }, update: { value: JSON.stringify(ids) }, create: { key: "featuredTrips", value: JSON.stringify(ids) } });
