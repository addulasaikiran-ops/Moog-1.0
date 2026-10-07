import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRateLimit } from "@/lib/rate-limit";
import { getClientKey, hashToken, isValidToken } from "@/lib/token";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Params) {
  const { token } = await params;
  if (!isValidToken(token)) return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!(await allowRateLimit("revoke-status:" + getClientKey(request), 60, 10 * 60_000))) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Cache-Control": "no-store" } });
  const share = await prisma.share.findUnique({ where: { revokeTokenHash: hashToken(token) }, select: { viewedAt: true, expiresAt: true, revokedAt: true } });
  if (!share) return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ viewed: !!share.viewedAt, available: !share.revokedAt && share.expiresAt > new Date() }, { headers: { "Cache-Control": "no-store" } });
}
