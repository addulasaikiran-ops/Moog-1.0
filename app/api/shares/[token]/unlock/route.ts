import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { allowRateLimit } from "@/lib/rate-limit";

const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW_MS = 10 * 60_000;
import { createAccessGrant, getClientKey, hashToken, verifySecret } from "@/lib/token";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 8192) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  const key = getClientKey(request);
  if (!(await allowRateLimit("unlock:" + key + ":" + token.slice(0, 12), ATTEMPT_LIMIT, ATTEMPT_WINDOW_MS))) {
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
  // Bind the access grant to this exact share URL. A token-specific cookie
  // avoids collisions with stale grants from older sessions or other shares.
  cookieStore.set(`moog_access_${token}`, grant, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: share.expiresAt,
  });

  // Remove the legacy root-scoped cookie from older deployments.
  cookieStore.set("moog_access", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.redirect(new URL(`/s/${token}`, request.url), 303);
}
