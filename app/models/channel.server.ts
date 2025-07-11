import { prisma } from "../db.server";

import type { ItemParseResult } from "./parsers/parse-channel-xml.server";
import { parseChannelXml } from "./parsers/parse-channel-xml.server";
import invariant from "tiny-invariant";
import { Channel, Collection, Item, User } from "./types.server";
import { ChannelErrors, getDocumentQuery } from "./utils.server";
import { cached } from "~/utils/cached";
import { fetchDocument } from "./parsers/get-channels-from-url";
import { normalizeHref } from "~/utils";

export async function createChannelFromXml(
  xmlInput: string,
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
    throw new ChannelErrors.dbUnavailible();
  }

  if (dbChannel) {
    throw new ChannelErrors.channelExists(dbChannel);
  }

  let parseResult: Awaited<ReturnType<typeof parseChannelXml>>;

  try {
    parseResult = await parseChannelXml(xmlInput);

    invariant(
      parseResult.channel.link,
      "Link is missing in the RSS definition",
    );
    invariant(
      typeof parseResult.channel.link === "string",
      "Link has been parsed in wrong format",
    );
    invariant(
      parseResult.channel.title,
      "Title is missing in the RSS definition",
    );
  } catch (_) {
    throw new ChannelErrors.incorrectDefinition();
  }

  if (!parseResult.channel.imageUrl) {
    try {
      const channelPageMeta = await getChannelPageMeta.$cached(
        new URL(feedUrl).origin,
        abortSignal,
      );
      parseResult.channel.imageUrl = channelPageMeta.image ?? null;
    } catch (error) {
      console.error(error);
    }
  }

  try {
    return await createChanel({
      channel: parseResult.channel,
      feedUrl: feedUrl,
      userId: request.userId,
      items: parseResult.channelItems ?? [],
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
  items: ItemParseResult;
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
  }) => {
    const feedUrl = params.feedUrl;
    const channelXml = await fetchDocument.$cached(
      new URL(feedUrl),
      params.signal,
    );
    const parseResult = await parseChannelXml(channelXml).catch((e) => {
      console.log(feedUrl, e.message);
      throw e;
    });
    const dbChannelItems = await getChannelItems({
      where: { channel: { feedUrl: feedUrl, userId: params.userId } },
      select: { link: true },
    });

    const newItems = parseResult.channelItems.filter(
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
        lastBuildDate: parseResult.channel.lastBuildDate,
        refreshDate: new Date(),
        items: {
          create: newItems,
        },
      },
    });

    if (!updatedChannel.imageUrl) {
      getChannelPageMeta
        .$cached(new URL(updatedChannel.link).origin, params.signal)
        .then((meta) => {
          if (!meta.image) {
            return;
          }
          updateChannel(params.userId, {
            where: {
              feedUrl_userId: {
                feedUrl: feedUrl,
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
      excludeRead: boolean | null;
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
      read: filters.excludeRead === true ? false : undefined,
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

const getChannelPageMeta = cached({
  fn: async (url: string, signal: AbortSignal) => {
    const response = await fetch(url, {
      signal: signal,
    });

    const query = getDocumentQuery(await response.text());

    function getContent(selector: string) {
      const node = query(selector);
      return node?.attr("content");
    }

    return {
      image: getContent('meta[property$="image"], meta[name$="image"]'),
    };
  },
  getKey: (url) => url,
  ttl: 1000 * 60 * 60,
});
