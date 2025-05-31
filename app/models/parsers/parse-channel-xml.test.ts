import { expect, test } from "vitest";
import { parseChannelXml } from "./parse-channel-xml.server";
import { TEST_FEED_DATA } from "./test-feed-data";

test("valid feed result", async () => {
  const [channelResult, items] = await parseChannelXml(
    TEST_FEED_DATA.TEST_CHANNEL_1
  );
  expect(channelResult.title).toBe("Feed Name");
  expect(channelResult.link).toBe("https://link.com");
  expect(channelResult.description).toBe("Description is missing");
  expect(channelResult.language).toBe("cs");
  expect(channelResult.category).toBe("");
  expect(channelResult.copyright).toBe("");
  expect(channelResult.copyright).toBe("");
  expect(channelResult.imageUrl).toBe("");
  expect(channelResult.rssVersion).toBe("2");
  expect(channelResult.rssVersion).toBe("2");

  expect(items[0]?.title).toBe("Item Title 1");
  expect(items[0]?.link).toBe("https://item.link");
  expect(items[0]?.description).toBe("Item description");
  expect(items[0]?.imageUrl).toBe("https://item.img");
  expect(items[0]?.pubDate?.toISOString()).toBe("2025-05-25T08:15:00.000Z");
});
