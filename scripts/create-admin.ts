import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

// Usage:
// npm run admin:create -- you@example.com 'a-long-password' 'Your Name'

const [email, password, name = "Super Admin"] =
  process.argv.slice(2);

const db = new PrismaClient();

async function main() {
  if (!email || !password || password.length < 10) {
    throw new Error(
      "Usage: email password (10+ characters) [name]"
    );
  }

  const normalizedEmail = email.toLowerCase();

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const user = await db.user.upsert({
    where: {
      email: normalizedEmail,
    },
    update: {
      role: "SUPER_ADMIN",
      passwordHash,
    },
    create: {
      email: normalizedEmail,
      name,
      role: "SUPER_ADMIN",
      passwordHash,
    },
  });

  console.log("Super admin ready:", user.email);
}

main()
  .catch((error) => {
    console.error("Admin creation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
