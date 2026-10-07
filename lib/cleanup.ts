import { prisma } from "@/lib/prisma";

let started = false;
export function startCleanupScheduler() {
  if (started) return;
  started = true;
  const run = async () => {
    try {
      const now = new Date();
      const result = await prisma.share.deleteMany({ where: { expiresAt: { lte: now } } });
      const rateLimitResult = await prisma.rateLimit.deleteMany({
        where: { OR: [{ windowStart: { lt: new Date(now.getTime() - 26 * 60 * 60_000) } }, { key: { not: { contains: ":client:" } } }] },
      });
      if (result.count > 0) console.info(JSON.stringify({ event: "expired_shares_deleted", count: result.count }));
      if (rateLimitResult.count > 0) console.info(JSON.stringify({ event: "stale_rate_limits_deleted", count: rateLimitResult.count }));
    } catch {
      console.error("Expired share cleanup failed.");
    }
  };
  void run();
  setInterval(() => void run(), 5 * 60_000).unref();
}
