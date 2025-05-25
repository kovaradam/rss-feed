import { expect, test } from "vitest";
import { parseLinksFromHtml } from "./parse-html.server";
import * as cheerio from "cheerio";

test("valid feed result", async () => {
  const html = await fetch("https://www.irozhlas.cz/rss").then((r) => r.text());

  const result = parseLinksFromHtml(cheerio.load(html));

  expect(result).toBe("2025-05-25T08:15:00.000Z");
});
