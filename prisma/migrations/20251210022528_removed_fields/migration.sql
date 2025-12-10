/*
  Warnings:

  - You are about to drop the column `about` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `W9_form` on the `Documents` table. All the data in the column will be lost.
  - You are about to drop the column `affiliations` on the `Documents` table. All the data in the column will be lost.
  - You are about to drop the column `attachments` on the `Documents` table. All the data in the column will be lost.
  - You are about to drop the column `institute_address` on the `Education` table. All the data in the column will be lost.
  - You are about to drop the column `funding_opions` on the `ProfessionalExperience` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `ProfessionalExperience` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "about",
ADD COLUMN     "secondary_contact" TEXT;

-- AlterTable
ALTER TABLE "Documents" DROP COLUMN "W9_form",
DROP COLUMN "affiliations",
DROP COLUMN "attachments",
ADD COLUMN     "introductionVideo" VARCHAR(500),
ADD COLUMN     "medicalLicense" VARCHAR(500),
ADD COLUMN     "resume" VARCHAR(500);

-- AlterTable
ALTER TABLE "Education" DROP COLUMN "institute_address";

-- AlterTable
ALTER TABLE "ProfessionalExperience" DROP COLUMN "funding_opions",
DROP COLUMN "language",
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];
