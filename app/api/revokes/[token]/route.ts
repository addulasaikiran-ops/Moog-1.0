import { NextResponse } from "next/server";
import { isAllowedOrigin } from "@/lib/origin";
import { prisma } from "@/lib/prisma";
import { allowRateLimit } from "@/lib/rate-limit";
import { getClientKey, hashToken, isValidToken } from "@/lib/token";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isAllowedOrigin(request)) return new NextResponse("Forbidden", { status: 403 });

  const { token } = await params;
  if (!isValidToken(token)) return new NextResponse("Not found", { status: 404 });

  if (!(await allowRateLimit("revoke:" + getClientKey(request), 10, 10 * 60_000))) {
    return NextResponse.json(
      { revoked: false, error: "Too many revoke attempts. Try again later." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const wantsJson = request.headers.get("accept")?.includes("application/json");
  const revokedAt = new Date();
  const result = await prisma.share.updateMany({
    where: { revokeTokenHash: hashToken(token), revokedAt: null, expiresAt: { gt: revokedAt } },
    data: { revokedAt },
  });

  if (result.count !== 1) {
    if (wantsJson) return NextResponse.json({ revoked: false, error: "Share is already unavailable." }, { status: 409, headers: { "Cache-Control": "no-store" } });
    return NextResponse.redirect(new URL("/revoke/" + token + "?status=unavailable", request.url), 303);
  }
  if (wantsJson) return NextResponse.json({ revoked: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  return NextResponse.redirect(new URL("/revoke/" + token + "?status=revoked", request.url), 303);
}
