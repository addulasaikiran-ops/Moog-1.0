import { createHmac, randomInt } from "node:crypto";

export const SHARE_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SHARE_CODE_RE = /^MG-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function normalizeShareCode(value: string): string {
  return value.toUpperCase().replace(/[\s-]/g, "");
}

export function formatShareCode(normalized: string): string {
  const raw = normalized.startsWith("MG") ? normalized.slice(2) : normalized;
  if (!/^[A-Z0-9]{8}$/.test(raw)) throw new Error("Invalid share code.");
  return `MG-${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function isValidShareCode(value: string): boolean {
  return SHARE_CODE_RE.test(value);
}

export function generateShareCode(): string {
  let raw = "";
  for (let i = 0; i < 8; i += 1) raw += SHARE_CODE_ALPHABET[randomInt(SHARE_CODE_ALPHABET.length)];
  return formatShareCode(raw);
}

export function hashShareCode(code: string, secret = process.env.CODE_HASH_SECRET): string {
  if (!secret) throw new Error("CODE_HASH_SECRET is not configured.");
  return createHmac("sha256", secret).update(normalizeShareCode(code), "utf8").digest("hex");
}