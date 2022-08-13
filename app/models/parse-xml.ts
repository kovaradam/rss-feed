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

  const rssData = result?.rss;
  const channelData = rssData?.channel?.[0];

  const lastBuildDate = channelData?.lastBuildDate?.[0];

  const channel: ChannelResult = {
    link: channelData?.link?.[0],
    title: channelData?.title?.[0] || 'Title is missing',
    description: channelData?.description?.[0] || 'Description is missing',
    category: channelData?.category?.[0] || '',
    imageUrl: channelData?.imageUrl?.[0] || 'Image is missing',
    language: channelData?.language?.[0] || 'Language is missing',
    copyright: channelData?.copyright?.[0] ?? '',
    lastBuildDate: lastBuildDate ? new Date(lastBuildDate) : null,
    rssVersion: rssData?.$?.version?.[0] ?? '',
  };

  const items =
    channelData?.item?.map((item: any): ItemParseResult[number] | undefined => {
      const description = item?.description?.[0];
      const link = item?.link?.[0] ?? '';

      return {
        link,
        title: item?.title?.[0] ?? '',
        description: typeof description === 'string' ? description : '',
        author: item?.author?.[0] ?? '',
        comments: item?.comments?.[0] ?? '',
        pubDate: new Date(item?.pubDate?.[0]),
        imageUrl:
          (item?.enclosure as { $: Enclosure }[] | undefined)
            ?.map((payload) => payload?.['$'])
            .filter(Boolean)
            .find((enclosure) => enclosure.type?.includes('image'))?.url ?? '',
        bookmarked: false,
        read: false,
      };
    }) ?? [];

  return [channel, items];
}