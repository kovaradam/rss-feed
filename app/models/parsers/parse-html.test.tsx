import { expect, test } from "vitest";
import { parseLinksFromHtml } from "./parse-html.server";
import { renderToString } from "react-dom/server";
import { getDocumentQuery } from "../utils.server";

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
  </html>,
);

test("valid feed result", async () => {
  const result = parseLinksFromHtml(getDocumentQuery(html));

  expect(result.length).toBe(2);

  expect(result[0]?.href).toBe("link1");

  expect(result[1]?.href).toBe("/rss");
});
