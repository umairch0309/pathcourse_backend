/*
  Warnings:

  - The values [PENDING,ACCEPTED,IN_PROGRESS,CANCELED] on the enum `AppointmentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppointmentStatus_new" AS ENUM ('BOOKED', 'COMPLETED', 'NO_SHOW');
ALTER TABLE "public"."Appointment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Appointment" ALTER COLUMN "status" TYPE "AppointmentStatus_new" USING ("status"::text::"AppointmentStatus_new");
ALTER TYPE "AppointmentStatus" RENAME TO "AppointmentStatus_old";
ALTER TYPE "AppointmentStatus_new" RENAME TO "AppointmentStatus";
DROP TYPE "public"."AppointmentStatus_old";
ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'BOOKED';
COMMIT;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "patientAge" INTEGER,
ADD COLUMN     "patientName" VARCHAR(100),
ADD COLUMN     "relationWithPatient" VARCHAR(100),
ALTER COLUMN "status" SET DEFAULT 'BOOKED';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "address" VARCHAR(500),
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "country" VARCHAR(100),
ADD COLUMN     "phone" VARCHAR(50),
ADD COLUMN     "zipCode" VARCHAR(20);
