import { PrismaClient } from "../app/__generated__/prisma/client";
import { SERVER_ENV } from "~/env.server";
import { createUser } from "~/models/user.server";

const prisma = new PrismaClient();

async function seed() {
  const userEmail = "rachel@remix.run";

  // cleanup the existing database
  await prisma.user.delete({ where: { email: userEmail } }).catch(() => {
    // no worries if it doesn't exist yet
  });
  await prisma.user
    .delete({ where: { email: SERVER_ENV.admin.email } })
    .catch(() => {
      // no worries if it doesn't exist yet
    });

  await createUser({
    email: userEmail,
    auth: { password: "racheliscool", type: "password" },
    disableConfirmEmail: true,
  });

  await createUser({
    email: SERVER_ENV.admin.email,
    auth: { password: SERVER_ENV.admin.password, type: "password" },
    isAdmin: true,
    disableConfirmEmail: true,
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
