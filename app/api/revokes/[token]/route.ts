import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken, isValidToken } from "@/lib/token";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== expectedOrigin) return new NextResponse("Forbidden", { status: 403 });

  const { token } = await params;
  if (!isValidToken(token)) return new NextResponse("Not found", { status: 404 });

  const revokedAt = new Date();
  const result = await prisma.share.updateMany({
    where: {
      revokeTokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { gt: revokedAt },
    },
    data: { revokedAt },
  });

  if (result.count !== 1) {
    return NextResponse.redirect(new URL(`/revoke/${token}?status=unavailable`, request.url), 303);
  }

  return NextResponse.redirect(new URL(`/revoke/${token}?status=revoked`, request.url), 303);
}
