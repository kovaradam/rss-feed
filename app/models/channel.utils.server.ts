import { DoesItRssApi } from "~/__generated__/does-it-rss";
import { booleanFilter, FirstParam } from "~/utils";
import { createChanel } from "./channel.server";
import { asDate, asNumber, asUrl } from "~/utils.server";
import { load } from "cheerio/slim";

type CreateChannelInput = FirstParam<typeof createChanel>;
type RssFeedResponse = DoesItRssApi["/json-feed"]["response"]["feed"];
export function mapRssFeedResponseToCreateInput(
  feed: RssFeedResponse,
  feedUrl: string,
  hash?: string,
): Pick<CreateChannelInput, "channel" | "items"> {
  let itemPubDateParseError = false;

  const items = mapRssFeedItemsResponseToCreateInput(feed.items, {
    onInvalidDate: () => {
      itemPubDateParseError = true;
    },
  });

  const feedLink = feed.link || feedUrl;

  return {
    channel: {
      link: feedLink,
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
          link: i.link,
          title: sanitize(i.title ?? ""),
          author: sanitize(i.author ?? ""),
          comments: asUrl(i.comments)?.href ?? "",
          description: sanitize(i.description?.slice(0, 1000) ?? ""),
          imageUrl: asUrl(i["extensions:imageUrl"])?.href ?? "",
          pubDate: pubDate ?? new Date(),
          bookmarked: false,
          read: false,
          hiddenFromFeed: false,
        };
      })
      .filter(booleanFilter) ?? []
  );
}

function sanitize(input: string) {
  if (!input) {
    return input;
  }
  const query = load(input, { xml: true });
  return query.text();
}
