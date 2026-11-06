import { db } from "./db";

// Homepage photo state lives in SiteSetting: "heroImage" is the live URL (the homepage already reads it),
// "heroLibrary" is a JSON list of every photo staff have uploaded so they can switch back without re-uploading.
export type HeroItem = { url: string; path: string };
export const HERO_MAX = 24;
export const HERO_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const HERO_PATH = /^site\/hero-\d{10,}-[a-z0-9]{4,12}\.(jpg|png|webp)$/;
export const ROLES_HERO = ["SUPER_ADMIN", "ADMIN", "CONTENT_EDITOR"] as const;

export async function readHero() {
  const rows = await db.siteSetting.findMany({ where: { key: { in: ["heroImage", "heroLibrary"] } } });
  const active = rows.find(r => r.key === "heroImage")?.value ?? null;
  let library: HeroItem[] = [];
  try {
    const raw = JSON.parse(rows.find(r => r.key === "heroLibrary")?.value ?? "[]");
    if (Array.isArray(raw)) library = raw.filter((x): x is HeroItem => typeof x?.url === "string" && typeof x?.path === "string");
  } catch { /* corrupt value: treat as empty */ }
  return { active, library };
}
export const saveLibrary = (library: HeroItem[]) => db.siteSetting.upsert({ where: { key: "heroLibrary" }, update: { value: JSON.stringify(library) }, create: { key: "heroLibrary", value: JSON.stringify(library) } });
export const setActive = (url: string) => db.siteSetting.upsert({ where: { key: "heroImage" }, update: { value: url }, create: { key: "heroImage", value: url } });
