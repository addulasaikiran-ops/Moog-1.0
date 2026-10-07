import { prisma } from "@/lib/prisma";

let started = false;
export function startCleanupScheduler() {
  if (started) return;
  started = true;
  const run = async () => {
    try {
      const result = await prisma.share.deleteMany({ where: { expiresAt: { lte: new Date() } } });
      if (result.count > 0) console.info(JSON.stringify({ event: "expired_shares_deleted", count: result.count }));
    } catch {
      console.error("Expired share cleanup failed.");
    }
  };
  void run();
  setInterval(() => void run(), 5 * 60_000).unref();
}
