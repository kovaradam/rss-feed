import type { Channel, Enclosure, Item } from '@prisma/client';
import { parseStringPromise } from 'xml2js';

export type ChannelResult = Partial<
  Omit<Channel, 'userId' | 'feedUrl' | 'id' | 'updatedAt' | 'createdAt'>
>;
export type ItemParseResult = Omit<Item, 'channelId'>[];

export async function parseChannelXml(
  channelXml: string
): Promise<[ChannelResult, ItemParseResult]> {
  const result = await parseStringPromise(channelXml);

  const rssData = getRssDataFromParsedXml(result);
  const channelData = getChannelDataFromRssData(rssData);

  const channelDataTransformer = new ChannelDataTransformer(channelData);

  const channel: ChannelResult = {
    link: channelDataTransformer.link,
    title: channelData?.title?.[0] || 'Title is missing',
    description: channelData?.description?.[0] || 'Description is missing',
    category: channelData?.category?.[0] || '',
    imageUrl: channelData?.imageUrl?.[0] || '',
    language: channelData?.language?.[0] || '',
    copyright: channelData?.copyright?.[0] ?? '',
    lastBuildDate: channelDataTransformer.lastBuildDate,
    rssVersion: rssData?.$?.version?.[0] ?? '',
  };
  const items =
    channelDataTransformer.items?.map(
      (item: any): ItemParseResult[number] | undefined => {
        const transformer = new ItemDataTransformer(item);

        return {
          link: transformer.link,
          title: transformer.title,
          description: transformer.description ?? '',
          author: transformer.author,
          comments: item?.comments?.[0] ?? '',
          pubDate: transformer.pubDate as Date,
          imageUrl:
            (item?.enclosure as { $: Enclosure }[] | undefined)
              ?.map((payload) => payload?.['$'])
              .filter(Boolean)
              .find((enclosure) => enclosure.type?.includes('image'))?.url ??
            '',
          bookmarked: false,
          read: false,
        };
      }
    ) ?? [];

  return [channel, items];
}

function getRssDataFromParsedXml(parsedXml: Record<string, any>) {
  return parsedXml?.rss ?? parsedXml.feed;
}

function getChannelDataFromRssData(rssData: Record<string, any>) {
  return rssData?.channel?.[0] ?? rssData;
}

class ChannelDataTransformer {
  constructor(private channelData: Record<string, any>) {
    this.channelData = channelData;
  }

  get link() {
    const link = this.channelData?.link?.[0];
    if (typeof link !== 'string') {
      return link?.$?.href;
    }
    return link;
  }
  get lastBuildDate() {
    const lastBuildDate =
      this.channelData?.lastBuildDate?.[0] ?? this.channelData?.updated?.[0];
    try {
      return new Date(lastBuildDate);
    } catch (_) {
      return null;
    }
  }
  get items() {
    const items = this.channelData?.item ?? this.channelData.entry;
    return items;
  }
}

class ItemDataTransformer {
  constructor(private itemData: Record<string, any>) {
    this.itemData = itemData;
  }
  get link() {
    const link = this.itemData?.link?.[0];
    if (typeof link !== 'string') {
      return link?.$?.href ?? '';
    }
    return link;
  }
  get title() {
    const title = this.itemData?.title?.[0];
    if (typeof title !== 'string') {
      return title?._ ?? '';
    }
    return title;
  }
  get description() {
    const description = this.itemData?.description?.[0];
    return typeof description === 'string' ? description : '';
  }
  get author() {
    const author = this.itemData?.author?.[0];
    if (typeof author !== 'string') {
      return author?.[0]?.name ?? '';
    }
    return author;
  }
  get pubDate() {
    const pubDate =
      this.itemData?.pubDate?.[0] ?? this.itemData?.published?.[0];
    try {
      return new Date(pubDate);
    } catch (_) {
      return null;
    }
  }
}
