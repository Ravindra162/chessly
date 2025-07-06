/*
  Warnings:

  - You are about to drop the column `time_remaining_black` on the `Games` table. All the data in the column will be lost.
  - You are about to drop the column `time_remaining_white` on the `Games` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Games" DROP COLUMN "time_remaining_black",
DROP COLUMN "time_remaining_white";
