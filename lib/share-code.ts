import { createHmac, randomInt } from "node:crypto";

export const SHARE_CODE_LENGTH = 6;
const SHARE_CODE_RE = /^\d{6}$/;

export function normalizeShareCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, SHARE_CODE_LENGTH);
}

export function formatShareCode(normalized: string): string {
  if (!SHARE_CODE_RE.test(normalized)) throw new Error("Invalid share code.");
  return normalized;
}

export function isValidShareCode(value: string): boolean {
  return SHARE_CODE_RE.test(normalizeShareCode(value));
}

export function generateShareCode(): string {
  let raw = "";
  for (let i = 0; i < SHARE_CODE_LENGTH; i += 1) raw += randomInt(10).toString();
  return raw;
}

export function hashShareCode(code: string, secret = process.env.CODE_HASH_SECRET): string {
  if (!secret) throw new Error("CODE_HASH_SECRET is not configured.");
  return createHmac("sha256", secret).update(normalizeShareCode(code), "utf8").digest("hex");
}
