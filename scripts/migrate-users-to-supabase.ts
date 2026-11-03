import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

// One-off: gives every existing User (no authId yet) a Supabase Auth account and links it.
// Old argon2 password hashes cannot be moved, so each person sets a new password with "Forgot password" on the login page.
// Run:  npm run admin:migrate-users   (needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
const db = new PrismaClient();
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const users = await db.user.findMany({ where: { authId: null, deletedAt: null } });
  let ok = 0;
  for (const u of users) {
    const { data, error } = await sb.auth.admin.createUser({ email: u.email, password: randomBytes(24).toString("base64url"), email_confirm: true, user_metadata: { name: u.name } });
    if (error || !data.user) { console.error("skip", u.email, error?.message); continue; }
    await db.user.update({ where: { id: u.id }, data: { authId: data.user.id } });
    ok++;
  }
  console.log(`Linked ${ok} of ${users.length} users. They must use "Forgot password" to set a password.`);
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
