import { normalizeHref } from "../../utils";

import { cached } from "../../utils/cached";
import { DoesItRssApi } from "~/__generated__/does-it-rss";
import { fetchFromRssClient } from "../utils.server";

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
