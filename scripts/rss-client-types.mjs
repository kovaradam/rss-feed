import { compile } from "json-schema-to-typescript";
import fs from "node:fs";
import path from "node:path";

const CONFIG = {
  url: "https://does-it-rss.com",
  sources: [{ typeName: "DoesItRssApi", path: "/__schema" }],
};

const typePromises = CONFIG.sources.map(async (entry) => {
  const url = new URL(entry.path, CONFIG.url);
  console.info(`[rss typegen]: resolving schema from ${url.href}`);
  return fetch(url.href)
    .then((r) => r.json())
    .then((jsonSchema) => compile(jsonSchema, entry.typeName))
    .then((typeString) => ({
      typeString: `\n// SCHEMA SOURCE: ${url.href}\n${typeString}`,
      source: entry,
    }))
    .catch(() => {
      console.error(`[rss typegen]: could not resolve schema from ${url.href}`);
    });
});

Promise.allSettled(typePromises)
  .then((results) => {
    return results.map((result) => {
      if (result.status === "rejected") {
        return "";
      }
      return result.value.typeString;
    });
  })
  .then((typeStrings) => typeStrings.join("\n"))
  .then((typesFile) => {
    const outDir = path.join("app", "__generated__", "does-it-rss");

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outFile = path.join(outDir, "index.ts");

    fs.writeFileSync(outFile, typesFile);
    console.info(`[rss typegen]: generated types into ${outFile}`);
  });
