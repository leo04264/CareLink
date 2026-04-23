-- CreateEnum
CREATE TYPE "MedicationFreq" AS ENUM ('DAILY', 'EVERY_OTHER', 'WEEKLY', 'AS_NEEDED');

-- CreateEnum
CREATE TYPE "MedicationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DELETED');

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "amountPerDose" TEXT,
    "color" TEXT,
    "note" TEXT,
    "frequency" "MedicationFreq" NOT NULL DEFAULT 'DAILY',
    "status" "MedicationStatus" NOT NULL DEFAULT 'ACTIVE',
    "pauseReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "elderId" TEXT NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationSchedule" (
    "id" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "mealContext" TEXT,
    "amountNote" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "medicationId" TEXT NOT NULL,

    CONSTRAINT "MedicationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationLog" (
    "id" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photoUrl" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "scheduleTime" TEXT,
    "medicationId" TEXT NOT NULL,

    CONSTRAINT "MedicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Medication_elderId_status_idx" ON "Medication"("elderId", "status");

-- CreateIndex
CREATE INDEX "MedicationSchedule_medicationId_idx" ON "MedicationSchedule"("medicationId");

-- CreateIndex
CREATE INDEX "MedicationLog_medicationId_takenAt_idx" ON "MedicationLog"("medicationId", "takenAt");

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "Elder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationSchedule" ADD CONSTRAINT "MedicationSchedule_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationLog" ADD CONSTRAINT "MedicationLog_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

