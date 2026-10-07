import test from "node:test";
import assert from "node:assert/strict";
import { getReceiveState, isReceiveRateLimited } from "../lib/receive.ts";

const base = { id: "share-test-id", expiresAt: new Date(Date.now() + 60_000), revokedAt: null as Date | null, passwordHash: null, viewOnce: false };

test("successful lookup returns a share token only", () => {
  assert.equal(getReceiveState(base), "available");
});

test("wrong code maps to not found", () => {
  assert.equal(getReceiveState(null), "not_found");
});

test("expired and revoked shares are unavailable", () => {
  assert.equal(getReceiveState({ ...base, expiresAt: new Date(Date.now() - 1) }), "expired");
  assert.equal(getReceiveState({ ...base, revokedAt: new Date() }), "revoked");
});

test("receive lookup remains only a locator for password and view-once shares", () => {
  const protectedShare = { ...base, passwordHash: "scrypt:secret", viewOnce: true };
  assert.equal(getReceiveState(protectedShare), "available");
  assert.equal(getReceiveState(protectedShare), "available");
});

test("rate limit locks after ten attempts or five failures", () => {
  assert.equal(isReceiveRateLimited(10, 5), false);
  assert.equal(isReceiveRateLimited(11, 5), true);
  assert.equal(isReceiveRateLimited(10, 6), true);
});