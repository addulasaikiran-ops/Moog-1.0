CREATE TABLE "AbuseReport" (
  "id" TEXT NOT NULL,
  "shareUrl" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "email" TEXT,
  "details" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'open',
  CONSTRAINT "AbuseReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AbuseReport_createdAt_idx" ON "AbuseReport"("createdAt");
CREATE INDEX "AbuseReport_status_createdAt_idx" ON "AbuseReport"("status", "createdAt");
