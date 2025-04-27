-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WebAuthnCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicKey" BLOB NOT NULL,
    "userId" TEXT NOT NULL,
    "lastUsedAt" DATETIME,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "transports" TEXT NOT NULL,
    CONSTRAINT "WebAuthnCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WebAuthnCredential" ("counter", "createdAt", "deviceType", "id", "lastUsedAt", "publicKey", "transports", "userId") SELECT "counter", "createdAt", "deviceType", "id", "lastUsedAt", "publicKey", "transports", "userId" FROM "WebAuthnCredential";
DROP TABLE "WebAuthnCredential";
ALTER TABLE "new_WebAuthnCredential" RENAME TO "WebAuthnCredential";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
