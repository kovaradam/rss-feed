import { PrismaClient } from '@prisma/client';
import invariant from 'tiny-invariant';
import { createUser } from '~/models/user.server';

const prisma = new PrismaClient();

async function seed() {
  const email = 'rachel@remix.run',
    adminEmail = process.env.ADMIN_EMAIL;

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });
  await prisma.user.delete({ where: { email: adminEmail } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  await createUser(email, 'racheliscool');

  invariant(adminEmail && process.env.ADMIN_PASS, 'Missing admin credentials');

  await createUser(adminEmail, process.env.ADMIN_PASS, {
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
