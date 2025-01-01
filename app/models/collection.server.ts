import { prisma } from '~/db.server';
import type { FirstParam } from './utils';
import type { Collection } from 'prisma/prisma-client';
import invariant from 'tiny-invariant';
export type { Collection };

export async function createDefaultCollections(userId: string) {
  return prisma.$transaction([
    prisma.collection.create({
      data: {
        title: 'Bookmarked',
        bookmarked: true,
        userId,
      },
    }),
    prisma.collection.create({
      data: {
        title: 'Read',
        read: true,
        userId,
      },
    }),
  ]);
}

export async function getCollections(
  params: FirstParam<typeof prisma.collection.findMany>
) {
  return prisma.collection.findMany(params);
}

export async function getCollection(
  id: string,
  userId: string,
  params?: FirstParam<typeof prisma.collection.findFirst>
) {
  return prisma.collection.findFirst({
    ...params,
    where: { ...params?.where, id, userId },
  });
}

export async function createCollection(
  params: FirstParam<typeof prisma.collection.create>
) {
  return prisma.collection.create(params);
}

export async function updateCollection(
  id: string,
  userId: string,
  params: FirstParam<typeof prisma.collection.update>
) {
  invariant(await getCollection(id, userId));
  return prisma.collection.update({
    ...params,
    where: { id: id },
  });
}

export async function deleteCollection(id: string, userId: string) {
  invariant(await getCollection(id, userId));
  return prisma.collection.delete({ where: { id } });
}

export async function deleteCollectionCategory({
  category,
  id,
  userId,
}: {
  id: string;
  category: string;
  userId: string;
}) {
  const collection = await getCollection(id, userId);
  invariant(collection);
  return prisma.collection.update({
    where: { id },
    data: {
      category: collection.category?.replace(category, '')?.replace('//', '/'),
    },
  });
}

export function getBooleanValue(input: string | null) {
  switch (input) {
    case 'null':
      return null;
    case 'false':
      return false;
    case 'true':
      return true;
    default:
      return null;
  }
}
