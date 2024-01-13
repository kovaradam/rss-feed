import { prisma } from '~/db.server';
import type { Channel, Collection, Item, User } from '@prisma/client';
import type { ItemParseResult } from './parse-xml';
import { parseChannelXml } from './parse-xml';
import invariant from 'tiny-invariant';
import { JSDOM } from 'jsdom';

export type { Channel, Item };

export async function createChannelFromXml(
  xmlInput: string,
  request: { userId: string; channelHref: string },
  abortSignal: AbortSignal
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
    throw new IncorrectDefinitionError();
  }

  let dbChannel = null;
  try {
    dbChannel = await getChannel({
      where: { link: channel.link, userId: request.userId },
    });
  } catch (error) {
    throw new UnavailableDbError();
  }

  if (dbChannel) {
    throw new ChannelExistsError(dbChannel);
  }

  if (!channel.imageUrl) {
    try {
      const channelPageMeta = await getChannelPageMeta(
        new URL(request.channelHref).origin,
        abortSignal
      );
      channel.imageUrl = channelPageMeta.image;
    } catch (error) {
      console.error(error);
    }
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
    throw error;
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
  feedUrl: string;
  userId: string;
  signal: AbortSignal;
}) {
  const channelRequest = await fetch(params.feedUrl, { signal: params.signal });
  const channelXml = await channelRequest.text();
  const [parsedChannel, parsedItems] = await parseChannelXml(channelXml);
  const dbChannelItems = await getChannelItems({
    where: { channel: { feedUrl: params.feedUrl, userId: params.userId } },
    select: { link: true },
  });

  const newItems = parsedItems.filter(
    (item) => !dbChannelItems.find((dbItem) => dbItem.link === item.link)
  );

  const updatedChannel = await updateChannel({
    where: {
      feedUrl_userId: {
        feedUrl: params.feedUrl,
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

  if (!updatedChannel.imageUrl) {
    getChannelPageMeta(new URL(updatedChannel.link).origin, params.signal)
      .then((meta) => {
        if (!meta.image) {
          return;
        }
        updateChannel({
          where: {
            feedUrl_userId: {
              feedUrl: params.feedUrl,
              userId: params.userId,
            },
          },
          data: {
            imageUrl: meta.image,
          },
        });
      })
      .catch(console.error);
  }

  return { updatedChannel, newItemCount: newItems.length };
}

export async function getChannel(
  params: Parameters<typeof prisma.channel.findMany>[0]
) {
  return prisma.channel.findFirst(params);
}

export async function updateChannel(
  params: Parameters<typeof prisma.channel.update>[0]
) {
  let { category } = params.data;
  if (typeof category === 'string') {
    category = category.split('/').filter(Boolean).join('/');
    if (category) {
      params.data.category = `/${category}/`;
    }
  }
  return prisma.channel.update(params);
}

export async function getChannels(
  params: Parameters<typeof prisma.channel.findMany>[0]
) {
  return prisma.channel.findMany({
    ...params,
    orderBy: { title: 'asc', ...params?.orderBy },
  });
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

export async function getChannelItems<
  T extends Parameters<typeof prisma.item.findMany>[0]
>(params: T) {
  return prisma.item.findMany(params);
}

export async function getChannelItem(itemId: string, userId: string) {
  return prisma.item.findFirst({
    where: { id: itemId, channel: { userId: userId } },
  });
}

export async function getQuotesByUser(userId: string, query: string | null) {
  const queryFilter = query ? { contains: query as string } : undefined;
  return prisma.quote.findMany({
    where: {
      item: {
        channel: { userId },
      },
      content: queryFilter,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      content: true,
      createdAt: true,
      id: true,
      itemId: true,
      item: {
        select: {
          title: true,
          id: true,
          channel: {
            select: {
              title: true,
              id: true,
            },
          },
        },
      },
    },
  });
}

export async function getQuotesByItem(itemId: string, userId: string) {
  return prisma.quote.findMany({
    where: { itemId, item: { channel: { userId } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addQuoteToItem(
  content: string,
  { itemId, userId }: { itemId: string; userId: string }
) {
  const item = await prisma.item.findFirst({
    where: { id: itemId, channel: { userId } },
  });
  invariant(item);
  return prisma.quote.create({
    data: { content: content.slice(0, 1000), itemId: item.id },
  });
}

export async function deleteQuote(id: string, userId: string) {
  const item = await prisma.item.findFirst({
    where: { quotes: { some: { id } }, channel: { userId } },
  });
  invariant(item);
  return prisma.quote.delete({
    where: { id },
  });
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
      excludeRead: boolean | null;
      q: string | null;
    };
    userId: User['id'];
  },
  params?: Parameters<typeof prisma.item.findMany>[0]
) {
  const items = await getChannelItems({
    ...params,

    where: {
      read: filters.excludeRead === true ? false : undefined,
      channel: {
        userId,
        id:
          filters.channels.length !== 0 ? { in: filters.channels } : undefined,
        AND:
          filters.categories.length !== 0
            ? filters.categories?.map((category) => ({
                category: { contains: `/${category}/` },
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

      ...getItemQueryFilter(filters.q ?? ''),
    },
  });

  items.forEach((item) => {
    item.description = item.description.slice(0, 1000);
  });

  return items;
}

export function getItemQueryFilter(query: string) {
  if (!query) {
    return {};
  }
  const searchFilter = { contains: query };
  return {
    OR: [
      { description: searchFilter },
      { title: searchFilter },
      { channel: { title: searchFilter } },
    ],
  };
}

export class ChannelExistsError extends Error {
  constructor(public channel: Channel) {
    super();
  }
}

export class UnavailableDbError extends Error {}

export class IncorrectDefinitionError extends Error {}

async function getChannelPageMeta(url: string, signal: AbortSignal) {
  const response = await fetch(url, {
    signal: signal,
  });
  const { window } = new JSDOM(await response.arrayBuffer());

  function getContent(selector: string) {
    const node = window.document.querySelector(selector);
    return node?.getAttribute('content');
  }

  return {
    image: getContent('meta[property$="image"], meta[name$="image"]'),
    imageAlt: getContent('meta[property$="image:alt"]'),
  };
}
