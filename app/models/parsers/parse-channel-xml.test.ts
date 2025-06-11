import { expect, test } from "vitest";
import { parseChannelXml } from "./parse-channel-xml.server";
import { TEST_FEED_DATA } from "./test-feed-data";

test("valid feed result", async () => {
  const { channel, channelItems } = await parseChannelXml(
    TEST_FEED_DATA.TEST_CHANNEL_1
  );
  expect(channel.title).toBe("Feed Name");
  expect(channel.link).toBe("https://link.com");
  expect(channel.description).toBe("Description is missing");
  expect(channel.language).toBe("cs");
  expect(channel.category).toBe("");
  expect(channel.copyright).toBe("");
  expect(channel.copyright).toBe("");
  expect(channel.imageUrl).toBe("");
  expect(channel.rssVersion).toBe("2");
  expect(channel.rssVersion).toBe("2");

  expect(channelItems[0]?.title).toBe("Item Title 1");
  expect(channelItems[0]?.link).toBe("https://item.link");
  expect(channelItems[0]?.description).toBe("Item description");
  expect(channelItems[0]?.imageUrl).toBe("https://item.img");
  expect(channelItems[0]?.pubDate?.toISOString()).toBe(
    "2025-05-25T08:15:00.000Z"
  );
});
