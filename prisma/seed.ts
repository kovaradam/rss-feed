import { PrismaClient } from '@prisma/client';
import { createUser } from '~/models/user.server';

const prisma = new PrismaClient();

async function seed() {
  const email = 'rachel@remix.run';

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  await createUser(email, 'racheliscool');
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
