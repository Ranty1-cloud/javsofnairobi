import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// Usage (needs DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment):
// npm run admin:create -- you@example.com 'a-long-password' 'Your Name'
// Creates (or updates) the login in Supabase Auth, then marks the matching profile row as SUPER_ADMIN.

const [rawEmail, password, name = "Super Admin"] = process.argv.slice(2);
const db = new PrismaClient();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first");
  if (!rawEmail || !password || password.length < 10) throw new Error("Usage: email password (10+ characters) [name]");
  const email = rawEmail.toLowerCase();
  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  let id: string;
  const created = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (!created.error && created.data.user) {
    id = created.data.user.id;
  } else {
    // Already registered: find them and reset the password.
    const list = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list.data?.users.find(u => u.email?.toLowerCase() === email);
    if (!existing) throw new Error("Supabase refused to create the user: " + created.error?.message);
    const upd = await sb.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    if (upd.error) throw new Error("Could not update the password: " + upd.error.message);
    id = existing.id;
  }

  const user = await db.user.upsert({
    where: { email },
    update: { role: "SUPER_ADMIN", deletedAt: null },
    create: { id, email, name, role: "SUPER_ADMIN", passwordHash: "managed-by-supabase" },
  });
  console.log("Super admin ready:", user.email);
}

main()
  .catch(error => { console.error("Admin creation failed:", error); process.exitCode = 1; })
  .finally(async () => { await db.$disconnect(); });
