CREATE TABLE "public"."Share" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'text',
    "imageData" BYTEA,
    "imageMime" TEXT,
    "imageName" TEXT,
    "tokenHash" TEXT NOT NULL,
    "passwordHash" TEXT,
    "viewOnce" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Share_tokenHash_key" ON "public"."Share"("tokenHash");
CREATE INDEX "Share_expiresAt_idx" ON "public"."Share"("expiresAt");
CREATE INDEX "Share_viewOnce_viewedAt_idx" ON "public"."Share"("viewOnce", "viewedAt");

ALTER TABLE "public"."Share" ENABLE ROW LEVEL SECURITY;
