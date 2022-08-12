import type { Channel, Item } from '@prisma/client';
import { parseStringPromise } from 'xml2js';

export async function parseChannelXml(
  channelXml: string
): Promise<[Partial<Omit<Channel, 'userId'>>, Item[]]> {
  const result = await parseStringPromise(channelXml);

  const rssData = result?.rss;
  const channelData = rssData?.channel?.[0];

  const lastBuildDate = channelData?.lastBuildDate?.[0];

  const channel: Omit<Channel, 'userId' | 'id' | 'updatedAt' | 'createdAt'> = {
    link: channelData?.link?.[0],
    title: channelData?.title?.[0] || 'Title is missing',
    description: channelData?.description?.[0] || 'Description is missing',
    category: channelData?.category?.[0] || 'Category is missing',
    imageUrl: channelData?.imageUrl?.[0] || 'Image is missing',
    language: channelData?.language?.[0] || 'Language is missing',
    copyright: channelData?.copyright?.[0] ?? '',
    lastBuildDate: lastBuildDate ? new Date(lastBuildDate) : null,
    rssVersion: rssData?.$?.version?.[0] ?? '',
  };

  const items = channelData?.item?.map((item: any): Omit<Item, 'channelId'> => {
    const description = item?.description?.[0];
    return {
      link: item?.link?.[0] ?? '',
      title: item?.title?.[0] ?? '',
      description: typeof description === 'string' ? description : '',
      author: item?.author?.[0] ?? '',
      comments: item?.comments?.[0] ?? '',
      pubDate: new Date(item?.pubDate?.[0]),
      enclosureId: 'todo',
    };
  });

  return [channel, items];
}
