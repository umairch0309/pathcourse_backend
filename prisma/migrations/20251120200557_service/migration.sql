/*
  Warnings:

  - You are about to drop the column `categoryId` on the `ProfessionalExperience` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[serviceId,duration]` on the table `ServicePricing` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serviceId` to the `ServicePricing` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProfessionalExperience" DROP CONSTRAINT "ProfessionalExperience_categoryId_fkey";

-- DropIndex
DROP INDEX "ServicePricing_duration_key";

-- AlterTable
ALTER TABLE "ProfessionalExperience" DROP COLUMN "categoryId";

-- AlterTable
ALTER TABLE "ServicePricing" ADD COLUMN     "serviceId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Category";

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- CreateIndex
CREATE INDEX "Service_name_idx" ON "Service"("name");

-- CreateIndex
CREATE INDEX "ServicePricing_serviceId_idx" ON "ServicePricing"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePricing_serviceId_duration_key" ON "ServicePricing"("serviceId", "duration");

-- AddForeignKey
ALTER TABLE "ServicePricing" ADD CONSTRAINT "ServicePricing_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
