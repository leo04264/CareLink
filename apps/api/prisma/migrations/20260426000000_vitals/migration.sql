-- CreateEnum
CREATE TYPE "HealthVitalType" AS ENUM ('BLOOD_PRESSURE', 'BLOOD_SUGAR');

-- CreateTable
CREATE TABLE "HealthVital" (
    "id" TEXT NOT NULL,
    "type" "HealthVitalType" NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "glucoseValue" DOUBLE PRECISION,
    "mealContext" TEXT,
    "elderId" TEXT NOT NULL,

    CONSTRAINT "HealthVital_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HealthVital_elderId_type_measuredAt_idx" ON "HealthVital"("elderId", "type", "measuredAt");

-- AddForeignKey
ALTER TABLE "HealthVital" ADD CONSTRAINT "HealthVital_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "Elder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

