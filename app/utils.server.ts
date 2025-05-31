import { CheerioAPI } from "cheerio";
import cron from "node-cron";

export function createTtl(
  ttl: number,
  cleanup: (interval: number) => Promise<void>,
  schedule: string
) {
  cleanup(ttl);
  cron.schedule(schedule, () => cleanup(ttl));
  return ttl;
}

export function getIsRssChannelFile(query: CheerioAPI) {
  const rssElement = query("feed,rss");
  return rssElement.length === 1;
}
