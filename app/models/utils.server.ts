import { Channel } from "./types.server";
import { DoesItRssApi } from "~/__generated__/does-it-rss";

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
  const clientUrl = new URL(path, "http://localhost:5173");

  Object.entries(searchParams).forEach(([key, value]) => {
    clientUrl.searchParams.set(key, String(value));
  });

  return fetch(clientUrl, init);
}

export async function fetchSingleFeed(
  feedUrl: string,
  init?: RequestInit & { currentHash?: string },
) {
  return fetchFromRssClient("/json-feed", { feed: feedUrl }, init).then((r) => {
    return {
      meta: {
        lastBuildDate: r.headers.get("x-last-build-date"),
        feedHash: r.headers.get("x-feed-hash"),
      },
      json: r.ok
        ? () => r.json() as Promise<DoesItRssApi["/json-feed"]["response"]>
        : null,
      response: r,
    };
  });
}
