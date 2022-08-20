/*
  Warnings:

  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Note";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Channel" (
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
    "imageUrl" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Channel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Item" (
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

-- CreateTable
CREATE TABLE "Image" (
    "url" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "channelLink" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Enclosure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "read" BOOLEAN,
    "bookmarked" BOOLEAN,
    "language" TEXT,
    "category" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_feedUrl_userId_key" ON "Channel"("feedUrl", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_link_channelId_key" ON "Item"("link", "channelId");
