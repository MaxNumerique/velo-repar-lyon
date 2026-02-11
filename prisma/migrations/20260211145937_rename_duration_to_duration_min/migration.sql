/*
  Warnings:

  - You are about to drop the column `duration` on the `ServicePackage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ServicePackage" DROP COLUMN "duration",
ADD COLUMN     "duration_min" INTEGER NOT NULL DEFAULT 30;
