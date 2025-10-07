import { DoesItRssApi } from "~/__generated__/does-it-rss";
import { booleanFilter, FirstParam } from "~/utils";
import { createChanel } from "./channel.server";
import { asDate, asNumber, asUrl } from "~/utils.server";
import { load } from "cheerio/slim";

type CreateChannelInput = FirstParam<typeof createChanel>;
type RssFeedResponse = DoesItRssApi["/json-feed"]["response"]["feed"];
export function mapRssFeedResponseToCreateInput({
  feed,
  feedUrl,
  etag,
  hash,
}: {
  feed: RssFeedResponse;
  feedUrl: string;
  hash?: string;
  etag?: string;
}): Pick<CreateChannelInput, "channel" | "items"> {
  let itemPubDateParseError = false;

  const items = mapRssFeedItemsResponseToCreateInput(feed.items, {
    onInvalidDate: () => {
      itemPubDateParseError = true;
    },
  });

  const feedLink = feed.link || feedUrl;

  return {
    channel: {
      link: sanitize(feedLink),
      title: sanitize(feed.title ?? "") || new URL(feedLink).hostname,
      description: sanitize(feed.description?.substring?.(0, 500) ?? ""),
      imageUrl: feed.extensions?.imageUrl ?? feed.image?.url ?? null,
      language: sanitize(feed.language || ""),
      refreshDate: null,
      ttl: asNumber(feed.ttl),
      hash: hash ?? null,
      lastBuildDate: asDate(feed.lastBuildDate),
      rssVersion: feed.rssVersion ?? "2.0",
      copyright: sanitize(feed.copyright ?? ""),
      category:
        feed.categories?.map((c) => sanitize(c.value ?? "")).join("/") ?? "",
      itemPubDateParseError,
      etag: etag ?? null,
    },
    items,
  };
}

export function mapRssFeedItemsResponseToCreateInput(
  items: RssFeedResponse["items"],
  params?: { onInvalidDate?(): void },
): CreateChannelInput["items"] {
  return (
    items
      ?.map((i) => {
        if (!i.link) {
          return null;
        }
        const pubDateParam = i.pubDate || i.updated;
        const pubDate = asDate(pubDateParam);

        if (pubDateParam && !pubDate) {
          params?.onInvalidDate?.();
        }

        return {
          link: sanitize(i.link),
          title: sanitize(i.title ?? ""),
          author: sanitize(i.author ?? ""),
          comments: asUrl(i.comments)?.href ?? "",
          description: sanitize(i.description?.slice(0, 1000) ?? ""),
          imageUrl: asUrl(i["extensions:imageUrl"])?.href ?? "",
          pubDate: pubDate ?? new Date(),
          bookmarked: false,
          read: false,
          hiddenFromFeed: false,
          enclosureType: i.enclosure?.type ?? null,
          enclosureUrl: i.enclosure?.url ?? null,
          enclosureLength: asNumber(i.enclosure?.length) ?? null,
        };
      })
      .filter(booleanFilter) ?? []
  );
}

function sanitize(input: string) {
  if (!input) {
    return input;
  }
  // this can turn e.g. "&lt;" into "<"
  const query = load(input, { xml: true });
  // so here it runs it once again to remove created tags
  return load(query.text(), { xml: true }).text();
}
