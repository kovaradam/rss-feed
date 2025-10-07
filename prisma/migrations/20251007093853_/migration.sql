/*
  Warnings:

  - You are about to drop the `Enclosure` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Item" ADD COLUMN "enclosureLength" INTEGER;
ALTER TABLE "Item" ADD COLUMN "enclosureType" TEXT;
ALTER TABLE "Item" ADD COLUMN "enclosureUrl" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Enclosure";
PRAGMA foreign_keys=on;
