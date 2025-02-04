-- AlterTable
ALTER TABLE "quippets"."_QuoteToTag" ADD CONSTRAINT "_QuoteToTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "quippets"."_QuoteToTag_AB_unique";
