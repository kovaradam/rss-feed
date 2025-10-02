import { cached } from "~/utils/cached";
import { Channel } from "./types.server";
import { DoesItRssApi } from "~/__generated__/does-it-rss";
import { normalizeHref } from "~/utils";
import { SERVER_ENV } from "~/env.server";

export const ChannelErrors = {
  channelExists: class ChannelExistsError extends Error {
    constructor(public channel: Channel) {
      super();
    }
  },
  invalidUrl: class InvalidUrlError extends Error {},
  htmlNoLinks: class HtmlNoLinksError extends Error {},
  dbUnavailable: class UnavailableDbError extends Error {},
  incorrectDefinition: class IncorrectDefinitionError extends Error {},
};

export function fetchFromRssClient(
  path: keyof Pick<DoesItRssApi, "/json" | "/json-feed">,
  searchParams: DoesItRssApi[typeof path]["search"],
  init?: RequestInit,
) {
  const clientUrl = new URL(path, SERVER_ENV.rssClientUrl);

  Object.entries(searchParams).forEach(([key, value]) => {
    clientUrl.searchParams.set(key, String(value));
  });

  return fetch(clientUrl, init);
}

export async function fetchSingleFeed(
  feedUrl: string,
  params: { etag?: string },
  init?: RequestInit,
) {
  const headers = {
    ...init?.headers,
    "if-none-match": params?.etag || "",
  };

  return fetchFromRssClient(
    "/json-feed",
    { feed: feedUrl },
    { ...init, headers },
  ).then((r) => {
    const hasCurrentVersion = r.status === 304;
    return {
      meta: {
        lastBuildDate: r.headers.get("x-last-build-date"),
        feedHash: r.headers.get("x-feed-hash"),
        etag: r.headers.get("etag"),
        hasCurrentVersion,
      },
      json:
        r.ok && !hasCurrentVersion
          ? () => r.json() as Promise<DoesItRssApi["/json-feed"]["response"]>
          : null,
      response: r,
    };
  });
}

type RssFeedListResponse = DoesItRssApi["/json"]["response"];

export async function getChannelsFromUrl(
  url: URL,
  abortSignal: AbortSignal,
): Promise<RssFeedListResponse["feeds"] | null> {
  const response = await fetchFromRssClient(
    "/json",
    { feed: url.href },
    {
      signal: abortSignal,
    },
  )
    .then(async (r) => {
      if (!r.ok) {
        return null;
      }
      return (await r.json()) as RssFeedListResponse;
    })
    .catch(() => null);

  return response?.feeds ?? null;
}

export const fetchDocument = cached({
  fn: (url: URL, signal: AbortSignal) =>
    fetch(url, {
      signal: AbortSignal.any([signal /**  AbortSignal.timeout(10 * 1000) */]),
    }).then((r) => {
      if (!r.ok) {
        throw "";
      }
      return r.text();
    }),
  getKey: (url) => normalizeHref(url.href),
  ttl: 60 * 1000,
});
