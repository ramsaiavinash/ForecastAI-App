/*
  Warnings:

  - A unique constraint covering the columns `[cr5c7_ProjectIDNumber]` on the table `cr5c7_projectmaster` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "cr5c7_projectmaster" ADD COLUMN "cr5c7_ProjectIDNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "cr5c7_projectmaster_cr5c7_ProjectIDNumber_key" ON "cr5c7_projectmaster"("cr5c7_ProjectIDNumber");
