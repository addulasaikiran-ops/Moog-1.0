import { deriveShareToken } from "@/lib/token";

export type ReceiveShare = {
  id: string;
  expiresAt: Date;
  revokedAt: Date | null;
  passwordHash?: string | null;
  viewOnce?: boolean;
};

export type ReceiveState = "available" | "not_found" | "expired" | "revoked";

export function getReceiveState(share: ReceiveShare | null, now = new Date()): ReceiveState {
  if (!share) return "not_found";
  if (share.revokedAt) return "revoked";
  if (share.expiresAt <= now) return "expired";
  return "available";
}

export function getReceiveToken(share: ReceiveShare): string {
  return deriveShareToken(share.id);
}

export function isReceiveRateLimited(attempts: number, failures: number): boolean {
  return attempts > 10 || failures > 5;
}