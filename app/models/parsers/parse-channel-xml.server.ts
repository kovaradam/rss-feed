/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Channel, Item } from "~/__generated__/prisma/client";
import { parseStringPromise } from "xml2js";
import { mapValue } from "../../utils/map-value";
import { load } from "cheerio/slim";
export type ChannelResult = Omit<
  Channel,
  "userId" | "feedUrl" | "id" | "updatedAt" | "createdAt"
>;

export type ItemParseResult = Omit<Item, "channelId" | "id">[];

export async function parseChannelXml(
  channelXml: string,
): Promise<{ channel: ChannelResult; channelItems: ItemParseResult }> {
  const result = await parseStringPromise(channelXml);

  const rssData = result?.rss ?? result.feed;
  const channelData = rssData?.channel?.[0] ?? rssData;
  const rssVersion = rssData?.$?.version?.[0];
  channelData.rssVersion = rssVersion;

  const channelDataTransformer = new ChannelDataTransformer(channelData);

  return {
    channel: channelDataTransformer.getResult(),
    channelItems: channelDataTransformer.transformedItems,
  };
}

class ChannelDataTransformer {
  constructor(
    private channelData: Record<string, any>,
    public transformedItems: ReturnType<
      ItemDataTransformer["getResult"]
    >[] = [],
    private hasItemPubDateErrors = false,
  ) {
    this.channelData = channelData;
    this.transformedItems = this.items?.map((item) => {
      itemTransformer.setItem(item);
      const newItem = itemTransformer.getResult();
      this.hasItemPubDateErrors =
        this.hasItemPubDateErrors || Boolean(itemTransformer.errors.pubDate);

      return newItem;
    });
  }

  get link() {
    const link = this.channelData?.link?.[0];
    if (typeof link !== "string") {
      return link?.$?.href;
    }
    return link;
  }

  get title() {
    const title = this.channelData?.title?.[0];
    if (typeof title !== "string") {
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

  get imageUrl() {
    const imageUrl = this.channelData?.imageUrl?.[0] ?? "";
    return imageUrl;
  }

  getResult(): ChannelResult {
    return {
      link: this.link,
      title: (this.title || new URL(this.link).hostname) ?? "Title is missing",
      description:
        this.channelData?.description?.[0]?.substring?.(0, 500) ||
        "Description is missing",
      category: this.channelData?.category?.[0] || "",
      imageUrl: this.imageUrl,
      language: this.channelData?.language?.[0] || "",
      copyright: this.channelData?.copyright?.[0] ?? "",
      refreshDate: null,
      lastBuildDate: this.lastBuildDate,
      rssVersion: this.channelData.rssVersion ?? "",
      itemPubDateParseError: this.hasItemPubDateErrors,
    };
  }
}

class ItemDataTransformer {
  errors: Partial<
    Record<keyof ReturnType<ItemDataTransformer["getResult"]>, boolean>
  > = {};
  private itemData: Record<string, any> | null = null;

  setItem(itemData: typeof this.itemData) {
    this.itemData = itemData;
    this.errors = {};
  }

  get link() {
    const link = this.itemData?.link?.[0];
    if (typeof link !== "string") {
      return link?.$?.href ?? "";
    }
    return link;
  }
  get title() {
    const title = this.itemData?.title?.[0];
    if (typeof title !== "string") {
      return title?._ ?? "";
    }
    return title;
  }
  get description() {
    const description = this.itemData?.description?.[0];
    return typeof description === "string" ? description?.slice(0, 1000) : "";
  }
  get author() {
    const author = this.itemData?.author?.[0];
    if (typeof author !== "string") {
      return author?.[0]?.name ?? "";
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

  get imageUrl() {
    return (
      (this.itemData?.enclosure
        ?.map((payload: any) => payload?.["$"])
        ?.filter(Boolean)
        ?.find((enclosure: any) => enclosure.type?.includes("image"))?.url ||
        //
        this.itemData?.["media:content"]
          ?.map((media: any) => media?.$)
          ?.filter(Boolean)
          ?.find((media: any) => media.medium?.includes("image"))?.url ||
        //
        mapValue(
          this.itemData?.["content:encoded"]
            ?.map((content: any) => content?.trim?.())
            ?.filter(Boolean)?.[0],
        )((xml) =>
          typeof xml === "string" ? load(xml)("img").attr("src") : null,
        )) ??
      ""
    );
  }

  getResult(): ItemParseResult[number] {
    return {
      link: this.link,
      title: this.title,
      description: this.description ?? "",
      author: this.author,
      comments: this.itemData?.comments?.[0] ?? "",
      pubDate: this.pubDate,
      imageUrl: this.imageUrl,
      bookmarked: false,
      read: false,
      hiddenFromFeed: false,
    };
  }
}

const itemTransformer = new ItemDataTransformer();
