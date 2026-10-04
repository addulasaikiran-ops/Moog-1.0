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

  return NextResponse.json({ deleted: result.count });
}