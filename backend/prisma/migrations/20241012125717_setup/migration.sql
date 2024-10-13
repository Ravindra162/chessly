/*
  Warnings:

  - You are about to drop the column `winner` on the `Games` table. All the data in the column will be lost.
  - Added the required column `winnerId` to the `Games` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Games" DROP COLUMN "winner",
ADD COLUMN     "winnerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Games" ADD CONSTRAINT "Games_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
