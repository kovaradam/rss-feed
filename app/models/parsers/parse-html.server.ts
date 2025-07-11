import { getDocumentQuery } from "../utils.server";

const RSS_LINK_QUERY = `
  [rel="alternate"][type="application/rss+xml"],
  [rel="alternate"][type="application/atom+xml"],
  [href*="rss" i],
  [href*="feed" i],
  [href*="atom" i],
  [title*="rss" i]
  `;

export function parseLinksFromHtml(query: ReturnType<typeof getDocumentQuery>) {
  const linkElements = query(RSS_LINK_QUERY).filter(
    (_, e) => e.tagName === "link" || e.tagName === "a",
  );

  const links: Array<{ href: string }> = [];

  linkElements.each((_, e) => {
    if (typeof e.attribs.href !== "string") {
      return;
    }

    links.push({
      href: e.attribs.href,
    });
  });

  return links;
}
