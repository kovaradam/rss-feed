-- CreateTable
CREATE TABLE "WebAuthnChallenge" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "challenge" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
