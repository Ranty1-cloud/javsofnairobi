import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
// Usage: npm run admin:create -- you@example.com 'a-long-password' 'Your Name'
const [email, password, name = "Admin"] = process.argv.slice(2);
if (!email || !password || password.length < 10) { console.error("Usage: email password(10+ chars) [name]"); process.exit(1); }
const db = new PrismaClient();
db.user.upsert({ where: { email: email.toLowerCase() }, update: { role: "SUPER_ADMIN" }, create: { email: email.toLowerCase(), name, role: "SUPER_ADMIN", passwordHash: "" } })
  .then(async u => db.user.update({ where: { id: u.id }, data: { passwordHash: await argon2.hash(password, { type: argon2.argon2id }) } }))
  .then(() => console.log("Super admin ready:", email)).finally(() => db.$disconnect());
