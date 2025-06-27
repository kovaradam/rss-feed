import { parseLinksFromHtml } from "./parse-html.server";
import { booleanFilter, filterUnique, normalizeHref } from "../../utils";
import { ChannelErrors, getDocumentQuery } from "../utils.server";
import { getIsRssChannelFile } from "../../utils.server";
import { cached } from "../../utils/cached";

type DefinitionResult = {
  feedXml: string;
  content: { title: string; description: string | undefined };
  url: URL;
};

export async function getChannelsFromUrl(
  url: URL,
  abortSignal: AbortSignal,
  recursion = {
    level: 0,
    fetched: [] as string[],
    parent: null as string | null,
  },
): Promise<DefinitionResult[] | null> {
  const u = (linkUrl: string | URL) => new URL(linkUrl, url);

  if (recursion.level === 3 || recursion.fetched.includes(url.href)) {
    return null;
  }

  recursion.fetched.push(url.href);

  const response = await fetchChannel.$cached(url, abortSignal).catch((_) => {
    throw new ChannelErrors.invalidUrl();
  });

  const query = getDocumentQuery(response);

  const isRssChannelFile = getIsRssChannelFile(query);

  if (isRssChannelFile) {
    return [
      {
        feedXml: response,
        url: url,
        content: {
          title: query(":is(feed,channel)>title:first-of-type").text().trim(),
          description:
            query(":is(feed,channel)>:is(description,subtitle):first-of-type")
              .text()
              .trim() || undefined,
        },
      },
    ];
  }

  const links = parseLinksFromHtml(query);

  if (!links.length) {
    throw new ChannelErrors.htmlNoLinks();
  }

  const nextRecursion = {
    ...recursion,
    level: recursion.level + 1,
    parent: url.pathname,
  };

  if (links.length === 1 && links[0]) {
    return getChannelsFromUrl(u(links[0].href), abortSignal, nextRecursion);
  }

  const traversedLinks = (
    await Promise.allSettled(
      links
        .filter((link) => link.href)
        .map(async (link) => {
          return getChannelsFromUrl(u(link.href), abortSignal, nextRecursion);
        }),
    )
  )
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .filter(booleanFilter)
    .filter(
      filterUnique(
        (a, b) => hrefToCompare(a.url.href) === hrefToCompare(b.url.href),
      ),
    );

  return traversedLinks;
}

export const fetchChannel = cached({
  fn: (url: URL, signal: AbortSignal) =>
    fetch(url, { signal }).then((r) => {
      if (!r.ok) {
        throw "";
      }
      return r.text();
    }),
  getKey: (url) => normalizeHref(url.href),
  ttl: 60 * 1000,
});

const hrefToCompare = (href: string) => normalizeHref(href).replace("www.", "");
