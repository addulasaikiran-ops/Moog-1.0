import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await prisma.share.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });

  const rateLimits = await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });

  return NextResponse.json({ deleted: result.count, rateLimitRowsDeleted: rateLimits.count });
}