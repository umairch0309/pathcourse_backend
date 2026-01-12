/*
  Warnings:

  - You are about to drop the column `duration` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `availableDurations` on the `Doctor` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `UserQuery` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `number` on the `UserQuery` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `email` on the `UserQuery` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the column `stripeAccountCompleted` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `stripeAccountId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `stripeAccountStatus` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `stripeOnboardingLink` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `DoctorReviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MedicalInfo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MedicalReports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServicePricing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `twoFactor` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `organizationEmail` to the `UserQuery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationName` to the `UserQuery` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionReasonType" AS ENUM ('LETTING_OFF_STEAM', 'TALKING_THROUGH_STRESS_OR_UNCERTAINTY', 'NEEDING_PERSPECTIVE_DURING_A_DEMANDING_PERIOD');

-- DropForeignKey
ALTER TABLE "DoctorReviews" DROP CONSTRAINT "DoctorReviews_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "DoctorReviews" DROP CONSTRAINT "DoctorReviews_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "DoctorReviews" DROP CONSTRAINT "DoctorReviews_patientId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalInfo" DROP CONSTRAINT "MedicalInfo_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "MedicalReports" DROP CONSTRAINT "MedicalReports_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Payments" DROP CONSTRAINT "Payments_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Payments" DROP CONSTRAINT "Payments_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "Payments" DROP CONSTRAINT "Payments_patientId_fkey";

-- DropForeignKey
ALTER TABLE "ServicePricing" DROP CONSTRAINT "ServicePricing_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "twoFactor" DROP CONSTRAINT "twoFactor_userId_fkey";

-- DropIndex
DROP INDEX "Appointment_duration_idx";

-- DropIndex
DROP INDEX "user_stripeAccountId_key";

-- DropIndex
DROP INDEX "user_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "duration",
DROP COLUMN "paymentStatus",
ADD COLUMN     "uploadId" VARCHAR(500),
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "availableDurations";

-- AlterTable
ALTER TABLE "UserQuery" ADD COLUMN     "organizationEmail" VARCHAR(255) NOT NULL,
ADD COLUMN     "organizationName" VARCHAR(200) NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "number" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "user" DROP COLUMN "stripeAccountCompleted",
DROP COLUMN "stripeAccountId",
DROP COLUMN "stripeAccountStatus",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeOnboardingLink",
ADD COLUMN     "employeeCode" VARCHAR(50),
ADD COLUMN     "enterpriseCode" VARCHAR(50);

-- DropTable
DROP TABLE "DoctorReviews";

-- DropTable
DROP TABLE "MedicalInfo";

-- DropTable
DROP TABLE "MedicalReports";

-- DropTable
DROP TABLE "Payments";

-- DropTable
DROP TABLE "Service";

-- DropTable
DROP TABLE "ServicePricing";

-- DropTable
DROP TABLE "twoFactor";

-- DropEnum
DROP TYPE "AppointmentPayment";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateTable
CREATE TABLE "enterprise" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "sessionsPerMonth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enterprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_reason" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "reason" "SessionReasonType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_reason_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enterprise_code_key" ON "enterprise"("code");

-- CreateIndex
CREATE INDEX "enterprise_code_idx" ON "enterprise"("code");

-- CreateIndex
CREATE UNIQUE INDEX "session_reason_appointmentId_key" ON "session_reason"("appointmentId");

-- CreateIndex
CREATE INDEX "session_reason_appointmentId_idx" ON "session_reason"("appointmentId");

-- CreateIndex
CREATE INDEX "session_reason_reason_idx" ON "session_reason"("reason");

-- CreateIndex
CREATE INDEX "UserQuery_userId_idx" ON "UserQuery"("userId");

-- CreateIndex
CREATE INDEX "UserQuery_email_idx" ON "UserQuery"("email");

-- CreateIndex
CREATE INDEX "user_enterpriseCode_idx" ON "user"("enterpriseCode");

-- AddForeignKey
ALTER TABLE "session_reason" ADD CONSTRAINT "session_reason_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
