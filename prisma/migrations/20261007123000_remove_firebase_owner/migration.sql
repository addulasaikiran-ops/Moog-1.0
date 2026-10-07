-- Moog no longer uses Firebase ownership. Remove the legacy owner column safely.
DROP INDEX IF EXISTS "Share_ownerUid_idx";
ALTER TABLE "Share" DROP COLUMN IF EXISTS "ownerUid";
