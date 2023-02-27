/*
  Warnings:

  - The required column `id` was added to the `Item` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
DROP TABLE IF EXISTS "new_Item";
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
    "imageUrl" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    CONSTRAINT "Item_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("author", "bookmarked", "channelId", "comments", "description", "imageUrl", "link", "pubDate", "read", "title", "id") SELECT "author", "bookmarked", "channelId", "comments", "description", "imageUrl", "link", "pubDate", "read", "title", "id" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE UNIQUE INDEX "Item_id_channelId_key" ON "Item"("id", "channelId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
