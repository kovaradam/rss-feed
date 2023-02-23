/*
  Warnings:

  - A unique constraint covering the columns `[requestedEmail]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "requestedEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_requestedEmail_key" ON "User"("requestedEmail");
