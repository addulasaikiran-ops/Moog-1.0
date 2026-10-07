import { NextResponse } from "next/server";
import { verifyFirebaseUser } from "@/lib/firebase-admin";
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

  const wantsJson = request.headers.get("accept")?.includes("application/json");
  const user = await verifyFirebaseUser(request);
  if (!user) {
    if (wantsJson) return NextResponse.json({ revoked: false, error: "Please sign in to revoke this share." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return new NextResponse("Please sign in to revoke this share.", { status: 401 });
  }

  const revokedAt = new Date();
  const result = await prisma.share.updateMany({
    where: { revokeTokenHash: hashToken(token), ownerUid: user.uid, revokedAt: null, expiresAt: { gt: revokedAt } },
    data: { revokedAt },
  });

  if (result.count !== 1) {
    if (wantsJson) return NextResponse.json({ revoked: false, error: "Share is already unavailable." }, { status: 409, headers: { "Cache-Control": "no-store" } });
    return NextResponse.redirect(new URL("/revoke/" + token + "?status=unavailable", request.url), 303);
  }
  if (wantsJson) return NextResponse.json({ revoked: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  return NextResponse.redirect(new URL("/revoke/" + token + "?status=revoked", request.url), 303);
}