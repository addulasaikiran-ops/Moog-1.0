import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashToken, isValidToken, verifyAccessGrant } from "@/lib/token";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== expectedOrigin) return new NextResponse("Forbidden", { status: 403 });

  const { token } = await params;
  if (!isValidToken(token)) return new NextResponse("Not found", { status: 404 });
  const tokenHash = hashToken(token);
  const share = await prisma.share.findUnique({ where: { tokenHash } });
  if (!share || !share.viewOnce || !share.viewedAt || share.expiresAt <= new Date()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const cookieStore = await cookies();
  const cookieName = `moog_reveal_${token}`;
  const revealGrant = cookieStore.get(cookieName)?.value;
  if (!revealGrant || !verifyAccessGrant(tokenHash, share.expiresAt, revealGrant)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const now = new Date();
  const claimed = await prisma.share.updateMany({
    where: { id: share.id, viewedAt: { not: null }, rConsumedAt: null, expiresAt: { gt: now } },
    data: { rConsumedAt: now },
  });
  if (claimed.count !== 1) return new NextResponse("Not found", { status: 404 });

  cookieStore.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({
    language: share.language,
    text: share.text,
    imageMime: share.imageMime,
    imageName: share.imageName,
    imageData: share.imageData ? Buffer.from(share.imageData).toString("base64") : null,
    expiresAt: share.expiresAt.toISOString(),
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
