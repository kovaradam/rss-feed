/*
  Warnings:

  - The primary key for the `WebAuthnChallenge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `WebAuthnChallenge` table. All the data in the column will be lost.
  - Added the required column `email` to the `WebAuthnChallenge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "WebAuthnCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicKey" BLOB NOT NULL,
    "userId" TEXT NOT NULL,
    "lastUsedAt" DATETIME NOT NULL,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "transports" TEXT NOT NULL,
    CONSTRAINT "WebAuthnCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WebAuthnChallenge" (
    "email" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "challenge" TEXT NOT NULL
);
INSERT INTO "new_WebAuthnChallenge" ("challenge", "createdAt") SELECT "challenge", "createdAt" FROM "WebAuthnChallenge";
DROP TABLE "WebAuthnChallenge";
ALTER TABLE "new_WebAuthnChallenge" RENAME TO "WebAuthnChallenge";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
