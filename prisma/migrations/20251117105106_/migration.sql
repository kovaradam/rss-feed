/*
  Warnings:

  - The primary key for the `FailedChannelUpload` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `FailedChannelUpload` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FailedChannelUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "link" TEXT NOT NULL,
    "error" TEXT NOT NULL
);
INSERT INTO "new_FailedChannelUpload" ("error", "link", "id") SELECT "error", "link", "link" FROM "FailedChannelUpload";
DROP TABLE "FailedChannelUpload";
ALTER TABLE "new_FailedChannelUpload" RENAME TO "FailedChannelUpload";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
