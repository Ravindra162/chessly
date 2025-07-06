-- DropForeignKey
ALTER TABLE "Games" DROP CONSTRAINT "Games_winnerId_fkey";

-- AlterTable
ALTER TABLE "Games" ALTER COLUMN "winnerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Games" ADD CONSTRAINT "Games_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
