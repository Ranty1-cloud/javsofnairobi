import { Role } from "@prisma/client";
import type { User as AuthUser } from "@supabase/supabase-js";
import { db } from "./db";
import { supabaseServer, supabaseConfigured } from "./supabase";

// Passwords and sessions are handled by Supabase Auth. The public "User" table only holds the profile and the role,
// and its id is the Supabase auth user id. passwordHash is a placeholder because Supabase owns the credentials.
const MANAGED = "managed-by-supabase";

// Finds (or creates, as a CUSTOMER) the profile row for a Supabase auth user.
export async function ensureUser(au: AuthUser) {
  const email = au.email?.toLowerCase();
  if (!email) return null;
  // Only trust an email match when Supabase has verified the address, so nobody can claim a staff row by signing up with its email.
  const by = au.email_confirmed_at ? [{ id: au.id }, { email }] : [{ id: au.id }];
  const found = await db.user.findFirst({ where: { OR: by, deletedAt: null } });
  if (found) return found;
  const name = String(au.user_metadata?.name ?? email.split("@")[0]).slice(0, 80);
  return db.user.create({ data: { id: au.id, email, name, passwordHash: MANAGED } }).catch(() => null);
}

async function currentUser() {
  if (!supabaseConfigured()) return null;
  // getUser() asks Supabase to validate the token every time; it is never trusted from the cookie alone.
  const { data } = await supabaseServer().auth.getUser();
  return data.user ? ensureUser(data.user) : null;
}

export async function getSession() {
  const u = await currentUser();
  return u ? { userId: u.id, role: u.role as Role } : null;
}
// Role comes from the database on every call so a demoted admin loses access immediately.
export async function requireRole(allowed: Role[]) {
  const u = await currentUser();
  return u && allowed.includes(u.role) ? u : null;
}
export const STAFF: Role[] = ["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "CONTENT_EDITOR", "FINANCE_MANAGER", "SUPPORT"];
