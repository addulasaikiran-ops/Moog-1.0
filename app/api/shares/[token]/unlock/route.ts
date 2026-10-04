import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createAccessGrant, getClientKey, hashToken, verifySecret } from "@/lib/token";

const attempts = new Map<string, { startedAt: number; count: number }>();
const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW_MS = 10 * 60_000;

function allowAttempt(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.startedAt >= ATTEMPT_WINDOW_MS) {
    attempts.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= ATTEMPT_LIMIT) return false;
  current.count += 1;
  return true;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const key = getClientKey(request);
  if (!allowAttempt(`${key}:${token.slice(0, 12)}`)) {
    return NextResponse.json({ error: "Too many password attempts. Try again later." }, { status: 429 });
  }

  const form = await request.formData();
  const password = form.get("password");
  if (typeof password !== "string" || !password) {
    return NextResponse.redirect(new URL(`/s/${token}?error=missing`, request.url), 303);
  }

  const share = await prisma.share.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!share || share.expiresAt <= new Date() || !share.passwordHash) {
    return NextResponse.redirect(new URL("/?error=unavailable", request.url), 303);
  }

  if (!verifySecret(password, share.passwordHash)) {
    return NextResponse.redirect(new URL(`/s/${token}?error=invalid`, request.url), 303);
  }

  const grant = createAccessGrant(share.tokenHash, share.expiresAt);
  const cookieStore = await cookies();
  cookieStore.set("moog_access", grant, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Use a site-wide path so the browser reliably sends the grant after the 303 redirect.
    // The grant is still cryptographically bound to this token hash and expiry.
    path: "/",
    expires: share.expiresAt,
  });

  return NextResponse.redirect(new URL(`/s/${token}`, request.url), 303);
}
