/*
  Warnings:

  - Added the required column `credentialId` to the `WebAuthnCredential` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WebAuthnCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credentialId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicKey" BLOB NOT NULL,
    "userId" TEXT NOT NULL,
    "lastUsedAt" DATETIME,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "transports" TEXT,
    CONSTRAINT "WebAuthnCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WebAuthnCredential" ("counter", "createdAt", "deviceType", "id", "lastUsedAt", "publicKey", "transports", "userId") SELECT "counter", "createdAt", "deviceType", "id", "lastUsedAt", "publicKey", "transports", "userId" FROM "WebAuthnCredential";
DROP TABLE "WebAuthnCredential";
ALTER TABLE "new_WebAuthnCredential" RENAME TO "WebAuthnCredential";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
