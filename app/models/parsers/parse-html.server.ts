import * as cheerio from "cheerio";

const RSS_LINK_QUERY = `
  [rel="alternate"][type="application/rss+xml"],
  [rel="alternate"][type="application/atom+xml"],
  [href*="rss" i],
  [href*="feed" i],
  [href*="atom" i],
  [title*="rss" i]
  `;

export function parseLinksFromHtml(query: cheerio.CheerioAPI) {
  const linkElements = query(RSS_LINK_QUERY).filter(
    (_, e) => e.tagName === "link" || e.tagName === "a"
  );

  const links: Array<{ href: string; tagName: "a" | "link" }> = [];

  linkElements.each((_, e) => {
    if (typeof e.attribs.href !== "string") {
      return;
    }

    if (e.tagName === "a") {
      links.push({
        href: e.attribs.href,
        tagName: "a",
      });
    }

    if (e.tagName === "link") {
      links.push({ href: e.attribs.href, tagName: "link" });
    }
  });

  return links;
}
