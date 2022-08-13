import { prisma } from '~/db.server';
import type { Channel, Item, User } from '@prisma/client';
import type { ItemParseResult } from './parse-xml';
import { parseChannelXml } from './parse-xml';

export type { Channel, Item };

export async function createChanel(input: {
  userId: User['id'];
  channel: Omit<Channel, 'userId'>;
  items: ItemParseResult;
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

export type ChannelWithItems = Channel & { items: Item[] };
export type ItemWithChannel = Item & { channel: Channel };

export async function refreshChannel(params: {
  channel: Pick<ChannelWithItems, 'feedUrl' | 'items'>;
  userId: string;
}) {
  const channelRequest = await fetch(params.channel.feedUrl);
  const channelXml = await channelRequest.text();
  const [parsedChannel, parsedItems] = await parseChannelXml(channelXml);

  const newItems = parsedItems.filter(
    (item) => !params.channel.items.find((dbItem) => dbItem.link === item.link)
  );

  return updateChannel({
    where: {
      feedUrl_userId: {
        feedUrl: params.channel.feedUrl,
        userId: params.userId,
      },
    },
    data: {
      lastBuildDate: parsedChannel.lastBuildDate,
      items: {
        create: newItems,
      },
    },
  });
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

export async function updateChannelItem(
  params: Parameters<typeof prisma.item.update>[0]
) {
  return prisma.item.update(params);
}
