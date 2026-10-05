CREATE TABLE "public"."RateLimit" (
  "key" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL,
  CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

ALTER TABLE "public"."RateLimit" ENABLE ROW LEVEL SECURITY;
