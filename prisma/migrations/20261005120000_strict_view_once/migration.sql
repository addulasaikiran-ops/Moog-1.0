ALTER TABLE "public"."Share" ADD COLUMN "revealTokenHash" TEXT;

CREATE UNIQUE INDEX "Share_revealTokenHash_key" ON "public"."Share"("revealTokenHash");