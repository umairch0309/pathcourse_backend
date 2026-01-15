/*
  Warnings:

  - You are about to drop the column `isAvailable` on the `Doctor` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Doctor_isAvailable_idx";

-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "isAvailable",
ADD COLUMN     "isAvailableToggle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Doctor_isAvailableToggle_idx" ON "Doctor"("isAvailableToggle");

-- CreateIndex
CREATE INDEX "Doctor_isOnline_idx" ON "Doctor"("isOnline");

-- CreateIndex
CREATE INDEX "Doctor_lastSeenAt_idx" ON "Doctor"("lastSeenAt");
