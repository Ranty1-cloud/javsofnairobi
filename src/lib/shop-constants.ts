// Safe to import from browser code (no database here).
import type { ProductKind, Role } from "@prisma/client";

export const BRAND_LABEL: Record<string, string> = { KIBURI_NATION: "Kiburi Nation", JAVS_OF_NAIROBI: "Javs of Nairobi" };
export const KIND_LABEL: Record<string, string> = { TSHIRT: "T-shirt", HOODIE: "Hoodie", CAP: "Cap", ARMBAND: "Arm band" };
export const KIND_PLURAL: Record<string, string> = { TSHIRT: "T-shirts", HOODIE: "Hoodies", CAP: "Caps", ARMBAND: "Arm bands" };
export const COLORS = ["White", "Black", "Red"] as const;
export const COLOR_HEX: Record<string, string> = { White: "#f5f5f5", Black: "#0b0b0b", Red: "#E50914" };
const CLOTHING = ["S", "M", "L", "XL", "XXL"], ONE = ["One size"];
export const SIZES: Record<ProductKind, string[]> = { TSHIRT: CLOTHING, HOODIE: CLOTHING, CAP: ONE, ARMBAND: ONE };
export const SHOP_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "FINANCE_MANAGER"];
export const HOLD_HOURS = 24; // an unpaid order gives its stock back after this long
export const MAX_LINES = 20, MAX_QTY = 10;
export const DELIVERY_FEE_KEY = "shop.deliveryFeeKes";
export const stockKey = (color: string, size: string) => `${color}|${size}`;
// 0712 345 678, +254712345678 and 254712345678 all become 254712345678. Returns null if it is not a Kenyan mobile number.
export function normalizePhone(raw: string) {
  const d = raw.replace(/[\s()-]/g, "").replace(/^\+/, "");
  const m = /^(?:254|0)?([17]\d{8})$/.exec(d);
  return m ? `254${m[1]}` : null;
}
export const slugify = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
