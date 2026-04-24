-- CreateTable
CREATE TABLE "SosEvent" (
    "id" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "location" TEXT,
    "elderId" TEXT NOT NULL,
    "acknowledgedById" TEXT,

    CONSTRAINT "SosEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SosEvent_elderId_triggeredAt_idx" ON "SosEvent"("elderId", "triggeredAt");

-- AddForeignKey
ALTER TABLE "SosEvent" ADD CONSTRAINT "SosEvent_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "Elder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosEvent" ADD CONSTRAINT "SosEvent_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

