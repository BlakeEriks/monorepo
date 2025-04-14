/*
  Warnings:

  - Added the required column `electionId` to the `votes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ai_newsletter"."votes" ADD COLUMN     "electionId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ai_newsletter"."elections" (
    "id" SERIAL NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "winningTopicId" INTEGER,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_newsletter"."election_topics" (
    "id" SERIAL NOT NULL,
    "electionId" INTEGER NOT NULL,
    "topicId" INTEGER NOT NULL,

    CONSTRAINT "election_topics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "election_topics_electionId_topicId_key" ON "ai_newsletter"."election_topics"("electionId", "topicId");

-- AddForeignKey
ALTER TABLE "ai_newsletter"."elections" ADD CONSTRAINT "elections_winningTopicId_fkey" FOREIGN KEY ("winningTopicId") REFERENCES "ai_newsletter"."topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_newsletter"."election_topics" ADD CONSTRAINT "election_topics_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "ai_newsletter"."elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_newsletter"."election_topics" ADD CONSTRAINT "election_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ai_newsletter"."topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_newsletter"."votes" ADD CONSTRAINT "votes_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "ai_newsletter"."elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
