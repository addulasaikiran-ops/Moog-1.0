-- Account-free Moog no longer uses Firebase ownerUid.
-- Keep this migration safe for databases that never had the column.
DROP INDEX IF EXISTS "Share_ownerUid_idx";
ALTER TABLE "Share" DROP COLUMN IF EXISTS "ownerUid";
