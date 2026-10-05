import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSecret(value: string): string {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(value, salt, 32).toString("hex");
  return `scrypt:${salt}:${digest}`;
}

export function verifySecret(value: string, stored: string): boolean {
  const [scheme, salt, digest] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !digest) return false;
  const actual = scryptSync(value, salt, 32);
  const expected = Buffer.from(digest, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export function isValidToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createAccessGrant(tokenHash: string, expiresAt: Date): string {
  const secret = process.env.ACCESS_SESSION_SECRET;
  if (!secret) throw new Error("ACCESS_SESSION_SECRET is not configured.");
  const payload = `${tokenHash}.${expiresAt.getTime()}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${expiresAt.getTime()}.${signature}`;
}

export function verifyAccessGrant(tokenHash: string, expiresAt: Date, grant: string): boolean {
  const secret = process.env.ACCESS_SESSION_SECRET;
  if (!secret) return false;
  const [grantExpiry, signature] = grant.split(".");
  if (!grantExpiry || !signature) return false;
  const expectedExpiry = expiresAt.getTime();
  if (grantExpiry !== String(expectedExpiry) || expectedExpiry <= Date.now()) return false;
  const payload = `${tokenHash}.${grantExpiry}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function getClientKey(request: Request): string {
  return request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}
