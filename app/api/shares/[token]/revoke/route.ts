import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRateLimit } from "@/lib/rate-limit";
import { getClientKey, hashToken, isValidToken } from "@/lib/token";
import { isAllowedOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Forbidden." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const { token } = await params;
  if (!isValidToken(token)) return NextResponse.json({ error: "Share unavailable." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 4096) return NextResponse.json({ error: "Request is too large." }, { status: 413, headers: { "Cache-Control": "no-store" } });
  if (!(await allowRateLimit("revoke:" + getClientKey(request), 20, 60_000))) return NextResponse.json({ error: "Too many revoke attempts. Try again later." }, { status: 429, headers: { "Cache-Control": "no-store" } });
  let body: { revokeToken?: unknown };
  try { body = await request.json() as { revokeToken?: unknown }; }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: { "Cache-Control": "no-store" } }); }
  if (typeof body.revokeToken !== "string" || !isValidToken(body.revokeToken)) return NextResponse.json({ error: "Share unavailable." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const now = new Date();
  const tokenHash = hashToken(token);
  const revokeTokenHash = hashToken(body.revokeToken);
  const share = await prisma.share.findUnique({ where: { tokenHash }, select: { id: true, revokeTokenHash: true, revokedAt: true, expiresAt: true } });
  if (!share || !share.revokeTokenHash || share.revokeTokenHash !== revokeTokenHash || share.revokedAt || share.expiresAt <= now) {
    return NextResponse.json({ error: "Share unavailable or revoke permission invalid." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const updated = await prisma.share.updateMany({
    where: { id: share.id, revokeTokenHash, revokedAt: null, expiresAt: { gt: now } },
    data: { revokedAt: now, codeHash: null },
  });
  if (updated.count !== 1) return NextResponse.json({ error: "Share unavailable or already revoked." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
