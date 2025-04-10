/*
  Warnings:

  - You are about to drop the column `status` on the `newsletters` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `newsletters` table. All the data in the column will be lost.
  - You are about to drop the column `votes` on the `newsletters` table. All the data in the column will be lost.
  - Added the required column `topicId` to the `newsletters` table without a default value. This is not possible if the table is not empty.
  - Made the column `publishedAt` on table `newsletters` required. This step will fail if there are existing NULL values in that column.
  - Made the column `content` on table `newsletters` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ai_newsletter"."TopicStatus" AS ENUM ('SUGGESTED', 'VOTING', 'PUBLISHED', 'ARCHIVED');

-- DropIndex
DROP INDEX "ai_newsletter"."newsletters_title_key";

-- AlterTable
ALTER TABLE "ai_newsletter"."newsletters" DROP COLUMN "status",
DROP COLUMN "title",
DROP COLUMN "votes",
ADD COLUMN     "performance" JSONB,
ADD COLUMN     "topicId" INTEGER NOT NULL,
ALTER COLUMN "publishedAt" SET NOT NULL,
ALTER COLUMN "publishedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "content" SET NOT NULL;

-- DropEnum
DROP TYPE "ai_newsletter"."newsletter_status";

-- CreateTable
CREATE TABLE "ai_newsletter"."topics" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ai_newsletter"."TopicStatus" NOT NULL DEFAULT 'SUGGESTED',
    "votes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_newsletter"."votes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "topicId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailHash" TEXT,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ai_newsletter"."votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_newsletter"."votes" ADD CONSTRAINT "votes_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ai_newsletter"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_newsletter"."newsletters" ADD CONSTRAINT "newsletters_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ai_newsletter"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
