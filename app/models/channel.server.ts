import { prisma } from '~/db.server';
import type { Channel, Item, User } from '@prisma/client';

export type { Channel, Item };

export async function createChanel(input: {
  userId: User['id'];
  channel: Omit<Channel, 'userId'>;
  items: Item[];
}) {
  return prisma.channel.create({
    data: {
      ...input.channel,
      items: { create: input.items },
      user: {
        connect: {
          id: input.userId,
        },
      },
    },
  });
}

export async function getChannelById(params: Pick<Channel, 'id' | 'userId'>) {
  return prisma.channel.findFirst({ where: params });
}

export async function getChannel(
  params: Parameters<typeof prisma.channel.findMany>[0]
) {
  return prisma.channel.findFirst(params);
}

export async function updateChannel(
  params: Parameters<typeof prisma.channel.update>[0]
) {
  return prisma.channel.update(params);
}

export async function getChannels(
  params: Parameters<typeof prisma.channel.findMany>[0]
) {
  return prisma.channel.findMany(params);
}

export async function deleteChannels() {
  return prisma.channel.deleteMany();
}

export function deleteChannel({
  id,
  userId,
}: Pick<Channel, 'id'> & { userId: User['id'] }) {
  return prisma.channel.deleteMany({
    where: { id, userId },
  });
}

export async function getChannelItems(
  params: Parameters<typeof prisma.item.findMany>[0]
) {
  return prisma.item.findMany(params);
}
