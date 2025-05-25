import * as cheerio from "cheerio";

export function parseLinksFromHtml(query: cheerio.CheerioAPI) {
  const linkElements = query(
    '[rel="alternate"][type="application/rss+xml"],[href*="rss" i]'
  ).filter((_, e) => e.tagName === "link" || e.tagName === "a");

  const hrefs: Array<
    { href: string } & ({ tagName: "a"; label: string } | { tagName: "link" })
  > = [];

  linkElements.each((_, e) => {
    if (typeof e.attribs.href !== "string") {
      return;
    }

    if (e.tagName === "a") {
      hrefs.push({
        href: e.attribs.href,
        tagName: "a",
        label: query.text([e]).trim(),
      });
    }

    if (e.tagName === "link") {
      hrefs.push({ href: e.attribs.href, tagName: "link" });
    }
  });

  return hrefs;
}
