/*
  Warnings:

  - You are about to drop the column `itemPubDateparseError` on the `Channel` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Channel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "link" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "feedUrl" TEXT NOT NULL,
    "lastBuildDate" DATETIME,
    "rssVersion" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "copyright" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "itemPubDateParseError" BOOLEAN,
    "imageUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Channel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Channel" ("category", "copyright", "createdAt", "description", "feedUrl", "id", "imageUrl", "language", "lastBuildDate", "link", "rssVersion", "title", "updatedAt", "userId") SELECT "category", "copyright", "createdAt", "description", "feedUrl", "id", "imageUrl", "language", "lastBuildDate", "link", "rssVersion", "title", "updatedAt", "userId" FROM "Channel";
DROP TABLE "Channel";
ALTER TABLE "new_Channel" RENAME TO "Channel";
CREATE UNIQUE INDEX "Channel_feedUrl_userId_key" ON "Channel"("feedUrl", "userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
