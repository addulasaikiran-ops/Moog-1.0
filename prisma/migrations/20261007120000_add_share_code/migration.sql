-- Add a nullable lookup hash so legacy shares remain link-only.
ALTER TABLE "Share" ADD COLUMN "codeHash" TEXT;
CREATE UNIQUE INDEX "Share_codeHash_key" ON "Share"("codeHash");