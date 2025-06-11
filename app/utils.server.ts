import cron from "node-cron";
import { getDocumentQuery } from "./models/utils.server";

export function createTtl(
  ttl: number,
  cleanup: (interval: number) => Promise<void>,
  schedule: string
) {
  cleanup(ttl);
  cron.schedule(schedule, () => cleanup(ttl));
  return ttl;
}

export function getIsRssChannelFile(
  query: ReturnType<typeof getDocumentQuery>
) {
  const rssElement = query("feed,rss");
  return rssElement.length === 1;
}
