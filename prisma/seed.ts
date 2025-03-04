import { PrismaClient } from "@prisma/client";
import invariant from "tiny-invariant";
import { createUser } from "~/models/user.server";

const prisma = new PrismaClient();

async function seed() {
  const userEmail = "rachel@remix.run";

  const adminEnvVariables = ["ADMIN_EMAIL", "ADMIN_PASS"];
  const [adminEmail, adminPassword] = adminEnvVariables.map(
    (key) => process.env[key]
  );

  // Check config vars
  invariant(
    adminEmail && adminPassword,
    `Missing admin credentials (please define ${adminEnvVariables
      .map((key) => `"${key}"`)
      .join(" and ")} in the ".env" file)`
  );

  // cleanup the existing database
  await prisma.user.delete({ where: { email: userEmail } }).catch(() => {
    // no worries if it doesn't exist yet
  });
  await prisma.user.delete({ where: { email: adminEmail } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  await createUser(userEmail, "racheliscool");

  await createUser(adminEmail, adminPassword, {
    isAdmin: true,
  });
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
