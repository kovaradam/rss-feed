import { prisma } from '~/db.server';
import type { Channel, Collection, Item, User } from '@prisma/client';
import type { ItemParseResult } from './parse-xml';
import { parseChannelXml } from './parse-xml';
import invariant from 'tiny-invariant';

export type { Channel, Item };

export type CreateFromXmlErrorType =
  | 'channelExists'
  | 'incorrectDefinition'
  | 'cannotAccessDb'
  | 'prismaError';

export async function createChannelFromXml(
  xmlInput: string,
  request: { userId: string; channelHref: string }
) {
  let channel: Awaited<ReturnType<typeof parseChannelXml>>[0];
  let items: Awaited<ReturnType<typeof parseChannelXml>>[1];

  try {
    [channel, items] = await parseChannelXml(xmlInput);

    invariant(channel.link, 'Link is missing in the RSS definition');
    invariant(
      typeof channel.link === 'string',
      'Link has been parsed in wrong format'
    );
    invariant(channel.title, 'Title is missing in the RSS definition');
  } catch (error) {
    throw createError('incorrectDefinition');
  }
  let dbChannel = null;
  try {
    dbChannel = await getChannel({
      where: { link: channel.link, userId: request.userId },
    });
  } catch (error) {
    throw createError('cannotAccessDb');
  }

  if (dbChannel) {
    throw createError('channelExists');
  }

  let newChannel;
  try {
    (channel as Channel).feedUrl = request.channelHref;
    newChannel = await createChanel({
      channel: channel as Channel,
      userId: request.userId,
      items: items ?? [],
    });
  } catch (error) {
    console.error(error);
    console.log(items);

    throw createError('prismaError');
  }

  return newChannel;
}

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
  dbChannel: Pick<ChannelWithItems, 'feedUrl' | 'items'>;
  userId: string;
}) {
  const channelRequest = await fetch(params.dbChannel.feedUrl);
  const channelXml = await channelRequest.text();
  const [parsedChannel, parsedItems] = await parseChannelXml(channelXml);

  const newItems = parsedItems.filter(
    (item) =>
      !params.dbChannel.items.find((dbItem) => dbItem.link === item.link)
  );

  return updateChannel({
    where: {
      feedUrl_userId: {
        feedUrl: params.dbChannel.feedUrl,
        userId: params.userId,
      },
    },
    data: {
      lastBuildDate: parsedChannel.lastBuildDate,
      refreshDate: new Date(),
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

export async function getItemsByCollection(
  {
    collectionId,
    userId,
  }: { collectionId: Collection['id']; userId: User['id'] },
  params?: Parameters<typeof prisma.item.findMany>[0]
) {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId },
  });

  const categories = collection?.category?.split('/').filter(Boolean);

  return prisma.item.findMany({
    ...params,
    where: {
      ...params?.where,
      read: collection?.read !== null ? collection?.read : undefined,
      bookmarked:
        collection?.bookmarked !== null ? collection?.bookmarked : undefined,
      channel: {
        userId,
        OR: categories?.length
          ? categories.map((category) => ({
              category: { contains: category },
            }))
          : undefined,
        language: collection?.language ? collection?.language : undefined,
      },
    },
  });
}

export type ChannelItemsFilter = Parameters<
  typeof getItemsByFilters
>[0]['filters'];

export async function getItemsByFilters(
  {
    filters,
    userId,
  }: {
    filters: {
      channels: string[];
      categories: string[];
      before: string | null;
      after: string | null;
    };
    userId: User['id'];
  },
  params?: Parameters<typeof prisma.item.findMany>[0]
) {
  return await getChannelItems({
    ...params,
    where: {
      channel: {
        userId,
        id:
          filters.channels.length !== 0 ? { in: filters.channels } : undefined,
        AND:
          filters.categories.length !== 0
            ? filters.categories?.map((category) => ({
                category: { contains: category },
              }))
            : undefined,
      },
      pubDate:
        filters.before || filters.after
          ? {
              gte: filters.after ? new Date(filters.after) : undefined,
              lte: filters.before ? new Date(filters.before) : undefined,
            }
          : undefined,
    },
  });
}

function createError(cause: CreateFromXmlErrorType) {
  return new Error(cause);
}
