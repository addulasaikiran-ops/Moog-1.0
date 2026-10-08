import { NextResponse } from "next/server";
import { isAllowedOrigin } from "@/lib/origin";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { allowRateLimit } from "@/lib/rate-limit";
import { createAccessGrant, getClientKey, hashToken, isValidToken, verifyAccessGrant } from "@/lib/token";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isAllowedOrigin(request)) return new NextResponse("Forbidden", { status: 403 });

  const { token } = await params;
  if (!isValidToken(token)) return new NextResponse("Not found", { status: 404 });
  const tokenHash = hashToken(token);
  if (!(await allowRateLimit("reveal:" + getClientKey(request) + ":" + tokenHash.slice(0, 16), 5, 10 * 60_000))) {
    return new NextResponse("Too many reveal attempts. Try again later.", { status: 429, headers: { "Cache-Control": "no-store" } });
  }
  const share = await prisma.share.findUnique({ where: { tokenHash } });

  if (!share || !share.viewOnce || share.expiresAt <= new Date()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const cookieStore = await cookies();
  const accessGrant = cookieStore.get(`moog_access_${token}`)?.value;
  const unlocked = !share.passwordHash || (!!accessGrant && verifyAccessGrant(tokenHash, share.expiresAt, accessGrant));
  if (!unlocked) return new NextResponse("Forbidden", { status: 403 });

  if (share.viewedAt) return new NextResponse("Not found", { status: 404 });

  const now = new Date();
  const claimed = await prisma.share.updateMany({
    where: { id: share.id, viewedAt: null, expiresAt: { gt: now } },
    data: { viewedAt: now },
  });
  if (claimed.count !== 1) return new NextResponse("Not found", { status: 404 });

  const revealGrant = createAccessGrant(tokenHash, share.expiresAt);
  cookieStore.set(`moog_reveal_${token}`, revealGrant, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: share.expiresAt,
  });

  return NextResponse.redirect(new URL(`/s/${token}`, request.url), 303);
}
