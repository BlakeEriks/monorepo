/*
  Warnings:

  - You are about to drop the column `votes` on the `topics` table. All the data in the column will be lost.
  - You are about to drop the column `emailHash` on the `votes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ai_newsletter"."topics" DROP COLUMN "votes";

-- AlterTable
ALTER TABLE "ai_newsletter"."votes" DROP COLUMN "emailHash";
