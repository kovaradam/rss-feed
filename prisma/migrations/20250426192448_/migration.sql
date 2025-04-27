/*
  Warnings:

  - The primary key for the `WebAuthnChallenge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `WebAuthnChallenge` table. All the data in the column will be lost.
  - The required column `id` was added to the `WebAuthnChallenge` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WebAuthnChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challenge" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_WebAuthnChallenge" ("challenge", "createdAt") SELECT "challenge", "createdAt" FROM "WebAuthnChallenge";
DROP TABLE "WebAuthnChallenge";
ALTER TABLE "new_WebAuthnChallenge" RENAME TO "WebAuthnChallenge";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
