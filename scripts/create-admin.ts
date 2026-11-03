import { PrismaClient } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Usage:
// npm run admin:create -- you@example.com 'a-long-password' 'Your Name'
// Creates (or promotes) a SUPER_ADMIN. The login lives in Supabase Auth, the role lives in the User table.
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (tsx does not load .env by itself, so use: npx dotenv -e .env -- ... or export them).

const [email, password, name = "Super Admin"] = process.argv.slice(2);
const db = new PrismaClient();

async function findAuthUser(sb: SupabaseClient, em: string) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find(u => u.email?.toLowerCase() === em);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  if (!email || !password || password.length < 10) throw new Error("Usage: email password (10+ characters) [name]");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const em = email.toLowerCase();

  let au = await findAuthUser(sb, em);
  if (au) {
    const { error } = await sb.auth.admin.updateUserById(au.id, { password, email_confirm: true });
    if (error) throw error;
  } else {
    const { data, error } = await sb.auth.admin.createUser({ email: em, password, email_confirm: true, user_metadata: { name } });
    if (error || !data.user) throw error ?? new Error("createUser failed");
    au = data.user;
  }
  const user = await db.user.upsert({
    where: { email: em },
    update: { role: "SUPER_ADMIN", authId: au.id, deletedAt: null },
    create: { email: em, name, role: "SUPER_ADMIN", authId: au.id },
  });
  console.log("Super admin ready:", user.email);
}

main().catch(e => { console.error("Admin creation failed:", e); process.exitCode = 1; }).finally(() => db.$disconnect());
