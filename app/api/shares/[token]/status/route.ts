import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken, isValidToken } from "@/lib/token";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Params) {
  const { token } = await params;
  if (!isValidToken(token)) {
    return NextResponse.json({ available: false }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const share = await prisma.share.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, revokedAt: true },
  });

  const available = !!share && !share.revokedAt && share.expiresAt > new Date();

  return NextResponse.json(
    { available },
    {
      status: available ? 200 : 404,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
