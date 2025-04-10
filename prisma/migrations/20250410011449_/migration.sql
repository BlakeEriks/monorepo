/*
  Warnings:

  - You are about to drop the column `userId` on the `votes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ai_newsletter"."votes" DROP CONSTRAINT "votes_userId_fkey";

-- AlterTable
ALTER TABLE "ai_newsletter"."votes" DROP COLUMN "userId",
ADD COLUMN     "subscriberId" INTEGER;

-- CreateTable
CREATE TABLE "ai_newsletter"."subscribers" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "ai_newsletter"."subscribers"("email");

-- AddForeignKey
ALTER TABLE "ai_newsletter"."votes" ADD CONSTRAINT "votes_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "ai_newsletter"."subscribers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
