import { prisma } from "../db.server";

import invariant from "tiny-invariant";
import { Channel, Collection, Item, User } from "./types.server";
import { ChannelErrors, fetchSingleFeed } from "./utils.server";
import { cached } from "~/utils/cached";
import { normalizeHref } from "~/utils";
import {
  mapRssFeedItemsResponseToCreateInput,
  mapRssFeedResponseToCreateInput,
} from "./channel.mappers.server";
import { DoesItRssApi } from "~/__generated__/does-it-rss";
import { asDate } from "~/utils.server";

export async function createChannelFromUrl(
  request: { userId: string; channelHref: string },
  abortSignal: AbortSignal,
) {
  const feedUrl = request.channelHref;

  let dbChannel = null;

  try {
    dbChannel = await getChannel({
      where: {
        feedUrl: { in: [feedUrl, normalizeHref(feedUrl)] },
        userId: request.userId,
      },
    });
  } catch (_) {
    throw new ChannelErrors.dbUnavailable();
  }

  if (dbChannel) {
    throw new ChannelErrors.channelExists(dbChannel);
  }

  let rssFeedResponse: DoesItRssApi["/json-feed"]["response"] | undefined;
  let rssFeedHash: string | undefined;
  let rssFeedEtag: string | undefined;
  try {
    [rssFeedResponse, rssFeedHash, rssFeedEtag] = await fetchSingleFeed(
      feedUrl,
      {},
      {
        signal: abortSignal,
      },
    ).then(async (r) => [
      await r.json?.(),
      r.meta.feedHash ?? undefined,
      r.meta.etag ?? undefined,
    ]);
    invariant(rssFeedResponse?.feed);
  } catch (_) {
    throw new ChannelErrors.invalidUrl();
  }

  let parseResult: ReturnType<typeof mapRssFeedResponseToCreateInput>;
  try {
    parseResult = mapRssFeedResponseToCreateInput({
      feed: rssFeedResponse.feed,
      feedUrl: feedUrl,
      hash: rssFeedHash,
      etag: rssFeedEtag,
    });
  } catch (e) {
    console.error(e);
    throw new ChannelErrors.incorrectDefinition();
  }

  try {
    return await createChanel({
      channel: parseResult.channel,
      feedUrl: feedUrl,
      userId: request.userId,
      items: parseResult.items,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function createChanel(input: {
  userId: User["id"];
  feedUrl: string;
  channel: Omit<
    Channel,
    "userId" | "updatedAt" | "createdAt" | "feedUrl" | "id"
  >;
  items: Array<Omit<Item, "id" | "channelId">>;
}) {
  return prisma.channel.create({
    data: {
      ...input.channel,
      feedUrl: normalizeHref(input.feedUrl),
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

export const refreshChannel = cached({
  fn: async (params: {
    feedUrl: string;
    userId: string;
    signal: AbortSignal;
    force?: boolean;
  }) => {
    const feedUrl = params.feedUrl;
    const refreshData = await getChannelRefreshData({
      feedUrl,
      userId: params.userId,
    });

    if (refreshData?.isFresh && !params.force) {
      return null;
    }

    const response = await fetchSingleFeed(
      feedUrl,
      {
        etag: refreshData?.etag ?? undefined,
      },
      {
        signal: params.signal,
      },
    );

    const hasCurrentVersion =
      refreshData?.hash === response.meta.feedHash ||
      response.meta.hasCurrentVersion;

    if (!params.force && hasCurrentVersion) {
      return null;
    }

    const feedPayload = await response.json?.();
    if (!feedPayload?.feed)
      throw new Error(
        `[${response.response.status}] No feed in payload ${JSON.stringify(feedPayload)}`,
      );

    const itemsParseResult = mapRssFeedItemsResponseToCreateInput(
      feedPayload?.feed?.items,
    );
    const dbChannelItems = await getChannelItems({
      where: { channel: { feedUrl: feedUrl, userId: params.userId } },
      select: { link: true },
    });

    const newItems = itemsParseResult.filter(
      (item) => !dbChannelItems.find((dbItem) => dbItem.link === item.link),
    );

    const updatedChannel = await updateChannel(params.userId, {
      where: {
        feedUrl_userId: {
          feedUrl: feedUrl,
          userId: params.userId,
        },
      },
      data: {
        hash: response.meta.feedHash,
        etag: response.meta.etag,
        lastBuildDate: asDate(feedPayload.feed.lastBuildDate),
        refreshDate: new Date(),
        items: {
          create: newItems,
        },
      },
    });

    if (!updatedChannel.imageUrl && feedPayload.feed?.extensions?.imageUrl) {
      updateChannel(params.userId, {
        where: {
          feedUrl_userId: {
            feedUrl: feedUrl,
            userId: params.userId,
          },
        },
        data: {
          imageUrl: feedPayload.feed.extensions.imageUrl,
        },
      }).catch(console.error);
    }

    return { updatedChannel, newItemCount: newItems.length };
  },
  getKey: (params) => `${params.feedUrl}-${params.userId}`,
  ttl: 60 * 1000,
});

export async function getChannel(
  params: Parameters<typeof prisma.channel.findMany>[0],
) {
  return prisma.channel.findFirst(params);
}

export async function updateChannel(
  userId: string,
  params: Parameters<typeof prisma.channel.update>[0],
) {
  invariant(await getChannel({ where: { id: params.where.id, userId } }));
  let { category } = params.data;
  if (typeof category === "string") {
    category = category.split("/").filter(Boolean).join("/");
    if (category) {
      params.data.category = `/${category}/`;
    }
  }

  return prisma.channel.update(params);
}

export async function deleteChannelCategory({
  id,
  category,
  userId,
}: {
  id: string;
  userId: string;
  category: string;
}) {
  const channel = await getChannel({ where: { id, userId } });
  invariant(channel);

  return prisma.channel.update({
    where: { id },
    data: {
      category: channel.category.replace(category, "").replace("//", "/"),
    },
  });
}

export async function getChannels(
  userId: User["id"],
  params?: Parameters<typeof prisma.channel.findMany>[0],
) {
  return prisma.channel.findMany({
    ...params,
    where: { ...params?.where, userId: userId },
    orderBy: { title: "asc", ...params?.orderBy },
  });
}

export async function deleteChannels() {
  return prisma.channel.deleteMany();
}

export function deleteChannel({
  id,
  userId,
}: Pick<Channel, "id"> & { userId: User["id"] }) {
  return prisma.channel.deleteMany({
    where: { id, userId },
  });
}

export async function getChannelItems<
  T extends Parameters<typeof prisma.item.findMany>[0],
>(params: T) {
  return prisma.item.findMany(params);
}

async function getChannelRefreshData(params: {
  feedUrl: string;
  userId: User["id"];
}) {
  const channel = await prisma.channel.findFirst({
    where: { feedUrl: params.feedUrl, userId: params.userId },
    select: {
      hash: true,
      etag: true,
      ttl: true,
      refreshDate: true,
      lastBuildDate: true,
    },
  });

  if (!channel) {
    return null;
  }

  const ttl = channel.ttl ?? 10; // minutes
  const ttlMs = ttl * 60 * 1000;

  const updateDate = channel.lastBuildDate ?? channel.refreshDate;

  return {
    etag: channel?.etag,
    hash: channel?.hash,
    isFresh: updateDate ? updateDate.getTime() + ttlMs >= Date.now() : false,
  };
}

export async function getChannelItem(itemId: string, userId: string) {
  return prisma.item.findFirst({
    where: { id: itemId, channel: { userId: userId } },
    include: {
      channel: true,
    },
  });
}

export async function getChannelItemByLink(link: string, userId: string) {
  return prisma.item.findFirst({
    where: { link: link, channel: { userId: userId } },
  });
}

export async function getQuotesByUser(
  userId: string,
  params?: { query: string | null; count?: number },
) {
  const queryFilter = params?.query
    ? { contains: params?.query as string }
    : undefined;
  const where = {
    item: {
      channel: { userId },
    },
    content: queryFilter,
  };
  return prisma.$transaction([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        content: true,
        createdAt: true,

        id: true,
        itemId: true,
        item: {
          select: {
            title: true,
            id: true,
            description: true,
            channel: {
              select: {
                title: true,
                id: true,
              },
            },
          },
        },
      },
      take: params?.count ? Math.min(params.count, 1000) : undefined,
    }),
    prisma.quote.count({ where }),
  ]);
}

export async function getQuotesByItem(
  itemId: string,
  userId: string,
  params?: { count?: number },
) {
  const where = { itemId, item: { channel: { userId } } };
  return prisma.$transaction([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params?.count ? Math.min(params?.count, 1000) : undefined,
    }),
    prisma.quote.count({ where }),
  ]);
}

export async function addQuoteToItem(
  content: string,
  { itemId, userId }: { itemId: string; userId: string },
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
  userId: string,
  params: Parameters<typeof prisma.item.update>[0],
) {
  const itemId = params.where.id;
  invariant(await getChannelItem(itemId ?? "", userId));
  return prisma.item.update(params);
}

export async function getItemsByCollection(
  {
    collectionId,
    userId,
  }: { collectionId: Collection["id"]; userId: User["id"] },
  params?: Parameters<typeof prisma.item.findMany>[0],
) {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId },
  });

  const categories = collection?.category?.split("/").filter(Boolean);

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
>[0]["filters"];

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
      excludeHiddenFromFeed: boolean | null;
      search: string | null;
    };
    userId: User["id"];
  },
  params?: Parameters<typeof prisma.item.findMany>[0],
) {
  const items = await getChannelItems({
    ...params,

    where: {
      hiddenFromFeed:
        filters.excludeHiddenFromFeed === true ? false : undefined,
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

      ...getItemQueryFilter(filters.search ?? ""),
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
