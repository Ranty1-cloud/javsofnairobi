import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { Role } from "@prisma/client";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
export async function startSession(userId: string, role: Role) {
  const token = await new SignJWT({ role }).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setExpirationTime("7d").sign(key());
  cookies().set("session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 604800, path: "/" });
}
export async function getSession() {
  const t = cookies().get("session")?.value;
  if (!t || !process.env.SESSION_SECRET) return null;
  try { const { payload } = await jwtVerify(t, key()); return { userId: payload.sub as string, role: payload.role as Role }; } catch { return null; }
}
// Role is re-read from the DB so a demoted admin loses access immediately, not when the token expires.
export async function requireRole(allowed: Role[]) {
  const s = await getSession();
  if (!s) return null;
  const { db } = await import("./db");
  const u = await db.user.findFirst({ where: { id: s.userId, deletedAt: null } });
  return u && allowed.includes(u.role) ? u : null;
}
export const STAFF: Role[] = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "CONTENT_EDITOR", "FINANCE_MANAGER", "SUPPORT"];
