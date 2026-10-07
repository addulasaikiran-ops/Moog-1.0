import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRateLimit } from "@/lib/rate-limit";
import { getClientKey } from "@/lib/token";
import { hashShareCode, normalizeShareCode } from "@/lib/share-code";

export const dynamic = "force-dynamic";

const ATTEMPT_LIMIT = 10;
const ATTEMPT_WINDOW_MS = 10 * 60_000;
const FAILURE_LIMIT = 5;
const FAILURE_WINDOW_MS = 10 * 60_000;
const MAX_BODY = 256;
const FAILURE_DELAY_MS = 50;

function response(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
async function failure(reason: "not_found" | "expired" | "revoked") {
  await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
  return response({ error: "Share unavailable.", reason }, 404);
}

export async function POST(request: Request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== expectedOrigin) return response({ error: "Forbidden" }, 403);

  const clientKey = getClientKey(request);
  if (!(await allowRateLimit("receive:" + clientKey, ATTEMPT_LIMIT, ATTEMPT_WINDOW_MS))) {
    return response({ error: "Too many attempts, try again later" }, 429);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY) return response({ error: "Invalid request." }, 400);

  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    return response({ error: "Invalid request." }, 400);
  }

  const normalized = normalizeShareCode(code);
  if (normalized.length !== 10 || !normalized.startsWith("MG-".replace("-", ""))) {
    await allowRateLimit("receive-fail:" + clientKey, FAILURE_LIMIT, FAILURE_WINDOW_MS);
    return failure("not_found");
  }

  let share: { tokenHash: string; expiresAt: Date; revokedAt: Date | null } | null = null;
  try {
    share = await prisma.share.findUnique({
      where: { codeHash: hashShareCode(code) },
      select: { tokenHash: true, expiresAt: true, revokedAt: true },
    });
  } catch {
    return response({ error: "Could not process the code." }, 500);
  }

  if (!share) {
    const failures = await allowRateLimit("receive-fail:" + clientKey, FAILURE_LIMIT, FAILURE_WINDOW_MS);
    if (!failures) return response({ error: "Too many attempts, try again later" }, 429);
    return failure("not_found");
  }
  if (share.revokedAt) {
    const failures = await allowRateLimit("receive-fail:" + clientKey, FAILURE_LIMIT, FAILURE_WINDOW_MS);
    if (!failures) return response({ error: "Too many attempts, try again later" }, 429);
    return failure("revoked");
  }
  if (share.expiresAt <= new Date()) {
    const failures = await allowRateLimit("receive-fail:" + clientKey, FAILURE_LIMIT, FAILURE_WINDOW_MS);
    if (!failures) return response({ error: "Too many attempts, try again later" }, 429);
    return failure("expired");
  }

  return response({ token: share.tokenHash }, 200);
}