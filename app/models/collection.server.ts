import { prisma } from '~/db.server';
import type { FirstParam } from './utils';
import type { Collection } from 'prisma/prisma-client';
export type { Collection };

export async function createDefaultCollections(userId: string) {
  await prisma.collection.create({
    data: {
      title: 'Bookmarked',
      bookmarked: true,
      userId,
    },
  });

  return prisma.collection.create({
    data: {
      title: 'Read',
      read: true,
      userId,
    },
  });
}

export async function getCollections(
  params: FirstParam<typeof prisma.collection.findMany>
) {
  return prisma.collection.findMany(params);
}

export async function getCollection(
  params: FirstParam<typeof prisma.collection.findFirst>
) {
  return prisma.collection.findFirst(params);
}

export async function createCollection(
  params: FirstParam<typeof prisma.collection.create>
) {
  return prisma.collection.create(params);
}

export async function updateCollection(
  params: FirstParam<typeof prisma.collection.update>
) {
  return prisma.collection.update(params);
}

export async function deleteCollection(
  params: FirstParam<typeof prisma.collection.delete>
) {
  return prisma.collection.delete(params);
}
