import { prisma } from "@/lib/prisma";

export async function allowRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const now = new Date();
  const result = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimit" ("key", "windowStart", "count")
    VALUES (${key}, ${now}, 1)
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = CASE
        WHEN EXTRACT(EPOCH FROM (${now} - "RateLimit"."windowStart")) * 1000 >= ${windowMs}
          THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN EXTRACT(EPOCH FROM (${now} - "RateLimit"."windowStart")) * 1000 >= ${windowMs}
          THEN ${now}
        ELSE "RateLimit"."windowStart"
      END
    RETURNING "count"
  `;
  return (result[0]?.count ?? limit + 1) <= limit;
}


export async function allowRateLimitCost(
  key: string,
  limit: number,
  windowMs: number,
  cost: number,
): Promise<boolean> {
  const safeCost = Math.max(1, Math.floor(cost));
  const now = new Date();
  const result = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimit" ("key", "windowStart", "count")
    VALUES (${key}, ${now}, ${safeCost})
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = CASE
        WHEN EXTRACT(EPOCH FROM (${now} - "RateLimit"."windowStart")) * 1000 >= ${windowMs}
          THEN ${safeCost}
        ELSE "RateLimit"."count" + ${safeCost}
      END,
      "windowStart" = CASE
        WHEN EXTRACT(EPOCH FROM (${now} - "RateLimit"."windowStart")) * 1000 >= ${windowMs}
          THEN ${now}
        ELSE "RateLimit"."windowStart"
      END
    RETURNING "count"
  `;
  return (result[0]?.count ?? limit + 1) <= limit;
}
