import type { Channel, Enclosure, Item } from '@prisma/client';
import { parseStringPromise } from 'xml2js';

export type ChannelResult = Partial<
  Omit<Channel, 'userId' | 'feedUrl' | 'id' | 'updatedAt' | 'createdAt'>
>;
export type ItemParseResult = Omit<Item, 'channelId' | 'id'>[];

export async function parseChannelXml(
  channelXml: string
): Promise<[ChannelResult, ItemParseResult]> {
  const result = await parseStringPromise(channelXml);

  const rssData = getRssDataFromParsedXml(result);
  const channelData = getChannelDataFromRssData(rssData);
  const rssVersion = rssData?.$?.version?.[0];

  const channelDataTransformer = new ChannelDataTransformer({
    ...channelData,
    rssVersion,
  });

  const items = channelDataTransformer.itemTransforms.map((transform) =>
    transform.getResult()
  );
  const channel = channelDataTransformer.getResult();

  return [channel, items];
}

function getRssDataFromParsedXml(parsedXml: Record<string, any>) {
  return parsedXml?.rss ?? parsedXml.feed;
}

function getChannelDataFromRssData(rssData: Record<string, any>) {
  return rssData?.channel?.[0] ?? rssData;
}

class ChannelDataTransformer {
  constructor(
    private channelData: Record<string, any>,
    public itemTransforms: ItemDataTransformer[] = []
  ) {
    this.channelData = channelData;
    this.itemTransforms = this.items?.map(
      (item) => new ItemDataTransformer(item)
    );
  }

  get link() {
    const link = this.channelData?.link?.[0];
    if (typeof link !== 'string') {
      return link?.$?.href;
    }
    return link;
  }

  get title() {
    const title = this.channelData?.title?.[0];
    if (typeof title !== 'string') {
      return title?._;
    }
    return title;
  }

  get lastBuildDate() {
    const lastBuildDate =
      this.channelData?.lastBuildDate?.[0] ?? this.channelData?.updated?.[0];
    try {
      return lastBuildDate ? new Date(lastBuildDate) : null;
    } catch (_) {
      return null;
    }
  }

  get items() {
    const items = this.channelData?.item ?? this.channelData.entry ?? [];
    return items as Array<Record<string, any>>;
  }

  get parseErrors(): Partial<Pick<Channel, 'itemPubDateParseError'>> {
    return {
      itemPubDateParseError: this.itemTransforms.some(
        (transform) => transform.errors.pubDate
      ),
    };
  }

  getResult(): ChannelResult {
    return {
      link: this.link,
      title: this.title || 'Title is missing',
      description:
        this.channelData?.description?.[0] || 'Description is missing',
      category: this.channelData?.category?.[0] || '',
      imageUrl: this.channelData?.imageUrl?.[0] || '',
      language: this.channelData?.language?.[0] || '',
      copyright: this.channelData?.copyright?.[0] ?? '',
      lastBuildDate: this.lastBuildDate,
      rssVersion: this.channelData.rssVersion ?? '',
      ...this.parseErrors,
    };
  }
}

class ItemDataTransformer {
  errors: Partial<
    Record<keyof ReturnType<ItemDataTransformer['getResult']>, boolean>
  > = {};
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
      this.itemData?.pubDate?.[0] ??
      this.itemData?.published?.[0] ??
      this.itemData?.updated?.[0];
    const pubDateObject = new Date(pubDate);

    if (isNaN(pubDateObject.getTime())) {
      this.errors.pubDate = true;
      return new Date();
    }

    return pubDateObject;
  }

  getResult(): ItemParseResult[number] {
    return {
      link: this.link,
      title: this.title,
      description: this.description ?? '',
      author: this.author,
      comments: this.itemData?.comments?.[0] ?? '',
      pubDate: this.pubDate,
      imageUrl:
        (this.itemData?.enclosure as { $: Enclosure }[] | undefined)
          ?.map((payload) => payload?.['$'])
          .filter(Boolean)
          .find((enclosure) => enclosure.type?.includes('image'))?.url ?? '',
      bookmarked: false,
      read: false,
    };
  }
}
