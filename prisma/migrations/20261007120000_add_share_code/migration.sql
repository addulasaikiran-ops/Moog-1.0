-- Keep Firebase ownerUid available on fresh databases while remaining safe on
-- production databases that already received the earlier db-push change.
ALTER TABLE "Share" ADD COLUMN IF NOT EXISTS "ownerUid" TEXT;
CREATE INDEX IF NOT EXISTS "Share_ownerUid_idx" ON "Share"("ownerUid");

-- Add a nullable lookup hash so legacy shares remain link-only.
ALTER TABLE "Share" ADD COLUMN IF NOT EXISTS "codeHash" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Share_codeHash_key" ON "Share"("codeHash");
