/*
  Warnings:

  - Added the required column `time_remaining_black` to the `Games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time_remaining_white` to the `Games` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Games" ADD COLUMN     "last_move_at" TIMESTAMP(3),
ADD COLUMN     "time_remaining_black" INTEGER NOT NULL,
ADD COLUMN     "time_remaining_white" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "index_whiteId" ON "Games"("whiteId");

-- CreateIndex
CREATE INDEX "index_blackId" ON "Games"("blackId");
