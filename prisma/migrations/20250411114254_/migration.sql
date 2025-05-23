/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `subscribers` will be added. If there are existing duplicate values, this will fail.
  - The required column `uuid` was added to the `subscribers` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "ai_newsletter"."subscribers" ADD COLUMN     "uuid" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_uuid_key" ON "ai_newsletter"."subscribers"("uuid");
