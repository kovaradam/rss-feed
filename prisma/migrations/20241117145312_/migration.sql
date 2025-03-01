-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "link" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pubDate" DATETIME NOT NULL,
    "author" TEXT NOT NULL,
    "comments" TEXT NOT NULL,
    "bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "hiddenFromFeed" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    CONSTRAINT "Item_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("author", "bookmarked", "channelId", "comments", "description", "id", "imageUrl", "link", "pubDate", "read", "title") SELECT "author", "bookmarked", "channelId", "comments", "description", "id", "imageUrl", "link", "pubDate", "read", "title" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE UNIQUE INDEX "Item_id_channelId_key" ON "Item"("id", "channelId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
