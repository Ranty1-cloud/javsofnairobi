import { z } from "zod";
import type { ProductKind } from "@prisma/client";
import { db } from "./db";
import { COLORS, SIZES, slugify } from "./shop-constants";

export const productBody = z.object({
  name: z.string().trim().min(2).max(80), brand: z.enum(["KIBURI_NATION", "JAVS_OF_NAIROBI"]), kind: z.enum(["TSHIRT", "HOODIE", "CAP", "ARMBAND"]),
  description: z.string().max(2000).default(""), priceKes: z.number().int().min(1).max(1_000_000),
  imageUrl: z.union([z.string().url(), z.literal("")]).transform(v => v || null), active: z.boolean(),
  stock: z.record(z.number().int().min(0).max(100_000)), // "Color|Size" -> how many. A colour/size that is missing is simply not offered.
});
// Turns the stock grid into variant rows, rejecting colours or sizes that don't belong to this kind of product.
export function variantsFrom(kind: ProductKind, stock: Record<string, number>) {
  const out: { color: string; size: string; stock: number }[] = [];
  for (const [k, n] of Object.entries(stock)) {
    const [color, size] = k.split("|");
    if (!(COLORS as readonly string[]).includes(color) || !SIZES[kind].includes(size)) return null;
    out.push({ color, size, stock: n });
  }
  return out;
}
export async function uniqueSlug(base: string) {
  let slug = slugify(base) || "item", n = 2;
  while (await db.product.findUnique({ where: { slug }, select: { id: true } })) slug = `${slugify(base)}-${n++}`;
  return slug;
}
