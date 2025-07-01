export const TEST_FEED_DATA = {
  TEST_CHANNEL_1: `
  <?xml version="1.0" encoding="utf-8"?>
  <rss version="2.0">
    <channel>
      <title>Feed Name</title>
      <link>https://link.com</link>
      <description></description>
      <language>cs</language>
      <item>
        <title>Item Title 1</title>
        <link>https://item.link</link>
        <description>Item description</description>
        <enclosure url="https://item.img" type="image/jpeg"/>
        <pubDate>Sun, 25 May 2025 10:15:00 +0200</pubDate>
      </item>
      <item>
        <title>Item Title 2</title>
        <media:content url="https://item2.img" medium="image"/>
      </item>
      <item>
        <title>Item Title 3</title>
        <content:encoded>
        <![CDATA[<img src='https://item3.img'/>]]>
        </content:encoded>
      </item>
    </channel>
  </rss>
  `,
  TEST_CHANNEL_2: `
  <?xml version="1.0" encoding="utf-8"?>
  <rss version="2.0">
  <channel>
  <title>Feed Name 2</title>
  <link>https://link.com</link>
  <description>Feed Description 2</description>
  <language>cs</language>
  <item>
  <title>Item Title 2</title>
  <link>https://item.link</link>
  <description>Item description</description>
  <enclosure url="https://item.img" type="image/jpeg"/>
  <pubDate>Sun, 25 May 2025 10:15:00 +0200</pubDate>
  </item>
  </channel>
  </rss>
  `,
  TEST_CHANNEL_3: `
  <?xml version="1.0" encoding="utf-8"?>
  <rss version="2.0">
  <channel>
  <title>Feed Name 3</title>
  <link>https://link.com</link>
  <description>Feed Description 3</description>
  <language>cs</language>
  <item>
  <title>Item Title 1</title>
  <link>https://item.link</link>
  <description>Item description</description>
  <enclosure url="https://item.img" type="image/jpeg"/>
  <pubDate>Sun, 25 May 2025 10:15:00 +0200</pubDate>
  </item>
  </channel>
  </rss>
  `,
  TEST_CHANNEL_4: `
  <?xml version="1.0" encoding="utf-8"?>
  <rss version="2.0">
  <channel>
  <title>Feed Name 4</title>
  <link>https://link.com</link>
  <description>Feed Description 4</description>
  <language>cs</language>
  <item>
  <title>Item Title 1</title>
  <link>https://item.link</link>
  <description>Item description</description>
  <enclosure url="https://item.img" type="image/jpeg"/>
  <pubDate>Sun, 25 May 2025 10:15:00 +0200</pubDate>
  </item>
  </channel>
  </rss>
  `,
};
