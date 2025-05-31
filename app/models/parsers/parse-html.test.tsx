import { expect, test } from "vitest";
import { parseLinksFromHtml } from "./parse-html.server";
import * as cheerio from "cheerio";
import { renderToString } from "react-dom/server";

const html = renderToString(
  <html lang="en">
    <head>
      <link
        rel="alternate"
        href="link1"
        title="RSS"
        type="application/rss+xml"
      />
    </head>
    <body>
      <a href="/rss">rss feeds</a>
    </body>
  </html>
);

test("valid feed result", async () => {
  const result = parseLinksFromHtml(cheerio.load(html));

  expect(result.length).toBe(2);

  expect(result[0]?.href).toBe("link1");
  expect(result[0]?.tagName).toBe("link");

  expect(result[1]?.href).toBe("/rss");
  expect(result[1]?.tagName).toBe("a");
});
