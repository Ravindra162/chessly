-- DropForeignKey
ALTER TABLE "Games" DROP CONSTRAINT "Games_blackId_fkey";

-- DropForeignKey
ALTER TABLE "Games" DROP CONSTRAINT "Games_whiteId_fkey";

-- AlterTable
ALTER TABLE "Games" ALTER COLUMN "whiteId" DROP NOT NULL,
ALTER COLUMN "blackId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Games" ADD CONSTRAINT "Games_whiteId_fkey" FOREIGN KEY ("whiteId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Games" ADD CONSTRAINT "Games_blackId_fkey" FOREIGN KEY ("blackId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
