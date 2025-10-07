/*
  Warnings:

  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Image";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Enclosure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "length" INTEGER,
    "type" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    CONSTRAINT "Enclosure_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmailRequest" ("createdAt", "email", "id", "userId") SELECT "createdAt", "email", "id", "userId" FROM "EmailRequest";
DROP TABLE "EmailRequest";
ALTER TABLE "new_EmailRequest" RENAME TO "EmailRequest";
CREATE UNIQUE INDEX "EmailRequest_userId_key" ON "EmailRequest"("userId");
CREATE UNIQUE INDEX "EmailRequest_email_key" ON "EmailRequest"("email");
CREATE TABLE "new_PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PasswordReset" ("createdAt", "id", "userId") SELECT "createdAt", "id", "userId" FROM "PasswordReset";
DROP TABLE "PasswordReset";
ALTER TABLE "new_PasswordReset" RENAME TO "PasswordReset";
CREATE UNIQUE INDEX "PasswordReset_userId_key" ON "PasswordReset"("userId");
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" TEXT NOT NULL,
    CONSTRAINT "Quote_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("content", "createdAt", "id", "itemId") SELECT "content", "createdAt", "id", "itemId" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Enclosure_itemId_key" ON "Enclosure"("itemId");
