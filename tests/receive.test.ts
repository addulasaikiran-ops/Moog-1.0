process.env.TOKEN_DERIVATION_SECRET = "test-token-secret";
import test from "node:test";
import assert from "node:assert/strict";
import { getReceiveState, getReceiveToken, isReceiveRateLimited } from "../lib/receive.ts";

const base = { id: "share-test-id", expiresAt: new Date(Date.now() + 60_000), revokedAt: null as Date | null, passwordHash: null, viewOnce: false };

test("successful lookup returns a share token only", () => {
  const token = getReceiveToken(base,);
  assert.equal(typeof token, "string");
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
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
  assert.match(getReceiveToken(protectedShare), /^[A-Za-z0-9_-]{43}$/);
});

test("rate limit locks after ten attempts or five failures", () => {
  assert.equal(isReceiveRateLimited(10, 5), false);
  assert.equal(isReceiveRateLimited(11, 5), true);
  assert.equal(isReceiveRateLimited(10, 6), true);
});