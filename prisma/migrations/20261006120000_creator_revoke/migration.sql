ALTER TABLE "Share"
  ADD COLUMN "revokeTokenHash" TEXT,
  ADD COLUMN "revokedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Share_revokeTokenHash_key" ON "Share"("revokeTokenHash");
CREATE INDEX "Share_revokedAt_idx" ON "Share"("revokedAt");