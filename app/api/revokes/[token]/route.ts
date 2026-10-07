import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";\nimport { allowRateLimit } from "@/lib/rate-limit";\nimport { getClientKey } from "@/lib/token";
import { hashToken, isValidToken } from "@/lib/token";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== expectedOrigin) return new NextResponse("Forbidden", { status: 403 });

  const { token } = await params;
  if (!isValidToken(token)) return new NextResponse("Not found", { status: 404 });

  const rateKey = "revoke:" + getClientKey(request);\n  if (!(await allowRateLimit(rateKey, 10, 10 * 60_000))) {\n    return NextResponse.json({ revoked: false, error: "Too many revoke attempts. Try again later." }, { status: 429, headers: { "Cache-Control": "no-store" } });\n  }\n\n  const wantsJson = request.headers.get("accept")?.includes("application/json");
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