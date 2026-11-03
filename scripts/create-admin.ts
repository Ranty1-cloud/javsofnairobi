import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const db = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  const user = await db.user.upsert({
    where: {
      email: email.toLowerCase()
    },
    update: {
      role: "SUPER_ADMIN"
    },
    create: {
      email: email.toLowerCase(),
      name,
      role: "SUPER_ADMIN",
      passwordHash: ""
    }
  });

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id
  });

  await db.user.update({
    where: {
      id: user.id
    },
    data: {
      passwordHash
    }
  });

  console.log("Super admin ready:", email);
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
