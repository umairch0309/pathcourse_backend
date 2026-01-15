/*
  Warnings:

  - You are about to drop the column `isAvailableToggle` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `isOnline` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `lastSeenAt` on the `Doctor` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Doctor_isAvailableToggle_idx";

-- DropIndex
DROP INDEX "Doctor_isOnline_idx";

-- DropIndex
DROP INDEX "Doctor_lastSeenAt_idx";

-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "isAvailableToggle",
DROP COLUMN "isOnline",
DROP COLUMN "lastSeenAt",
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Doctor_isAvailable_idx" ON "Doctor"("isAvailable");
