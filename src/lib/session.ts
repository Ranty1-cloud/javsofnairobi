import type { Role } from "@prisma/client";
import type { User as AuthUser } from "@supabase/supabase-js";
import { supabaseServer } from "./supabase";

// Supabase owns identity (passwords, sessions, email links). The Prisma User row is the app profile and the ONLY source of
// truth for role. Never read roles from Supabase user_metadata: users can edit their own metadata.
export async function profileFor(au: AuthUser) {
  // Unconfirmed emails never get a profile and are never linked, so nobody can claim an existing account by signing up with its email.
  if (!au.email || !au.email_confirmed_at) return null;
  const { db } = await import("./db");
  const email = au.email.toLowerCase();
  const linked = await db.user.findFirst({ where: { authId: au.id, deletedAt: null } });
  if (linked) return linked;
  try {
    const byEmail = await db.user.findUnique({ where: { email } });
    if (byEmail) {
      if (byEmail.deletedAt || byEmail.authId) return null; // closed account, or already tied to a different Supabase user
      return await db.user.update({ where: { id: byEmail.id }, data: { authId: au.id } }); // first login of a pre-migration user
    }
    const m = (au.user_metadata ?? {}) as Record<string, unknown>;
    const name = typeof m.name === "string" && m.name.trim() ? m.name.trim().slice(0, 80) : email.split("@")[0];
    const phone = typeof m.phone === "string" && m.phone.trim() ? m.phone.trim().slice(0, 30) : undefined;
    return await db.user.create({ data: { authId: au.id, email, name, phone } }); // role defaults to CUSTOMER
  } catch {
    // Two requests raced to create the same profile; the other one won.
    return db.user.findFirst({ where: { authId: au.id, deletedAt: null } });
  }
}

export async function getSession() {
  const { data: { user } } = await supabaseServer().auth.getUser(); // validated by Supabase, not just decoded from the cookie
  if (!user) return null;
  const p = await profileFor(user);
  return p ? { userId: p.id, role: p.role as Role } : null;
}

// Role is read from the DB on every call so a demoted admin loses access immediately.
export async function requireRole(allowed: Role[]) {
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) return null;
  const p = await profileFor(user);
  return p && allowed.includes(p.role) ? p : null;
}
export const STAFF: Role[] = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "CONTENT_EDITOR", "FINANCE_MANAGER", "SUPPORT"];
