-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "hospital" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'UPCOMING',
    "remindDays" INTEGER[] DEFAULT ARRAY[1, 7]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "elderId" TEXT NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_elderId_status_scheduledAt_idx" ON "Appointment"("elderId", "status", "scheduledAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "Elder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

