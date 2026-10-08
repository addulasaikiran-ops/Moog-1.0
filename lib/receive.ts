export type ReceiveShare = {
  id: string;
  expiresAt: Date;
  passwordHash?: string | null;
  viewOnce?: boolean;
};

export type ReceiveState = "available" | "not_found" | "expired";

export function getReceiveState(share: ReceiveShare | null, now = new Date()): ReceiveState {
  if (!share) return "not_found";
  if (share.expiresAt <= now) return "expired";
  return "available";
}


export function isReceiveRateLimited(attempts: number, failures: number): boolean {
  return attempts > 10 || failures > 5;
}