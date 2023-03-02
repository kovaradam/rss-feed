/*
  Warnings:

  - Added the required column `error` to the `FailedChannelUpload` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FailedChannelUpload" (
    "link" TEXT NOT NULL PRIMARY KEY,
    "error" TEXT NOT NULL
);
INSERT INTO "new_FailedChannelUpload" ("link") SELECT "link" FROM "FailedChannelUpload";
DROP TABLE "FailedChannelUpload";
ALTER TABLE "new_FailedChannelUpload" RENAME TO "FailedChannelUpload";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
