CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Share_tokenHash_key" ON "Share"("tokenHash");
CREATE INDEX "Share_expiresAt_idx" ON "Share"("expiresAt");