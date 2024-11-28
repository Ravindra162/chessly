/*
  Warnings:

  - You are about to drop the column `board` on the `Games` table. All the data in the column will be lost.
  - You are about to drop the column `last_move_at` on the `Games` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Games" DROP COLUMN "board",
DROP COLUMN "last_move_at",
ADD COLUMN     "Time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
