import test from "node:test";
import assert from "node:assert/strict";
import { createAccessGrant, generateToken, hashSecret, hashToken, isValidToken, verifyAccessGrant, verifySecret } from "../lib/token.ts";

test("generated tokens are canonical 43-character base64url values", () => {
  const token = generateToken();
  assert.equal(token.length, 43);
  assert.equal(isValidToken(token), true);
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
});

test("token validation rejects malformed values", () => {
  assert.equal(isValidToken(""), false);
  assert.equal(isValidToken("short"), false);
  assert.equal(isValidToken("a".repeat(42)), false);
  assert.equal(isValidToken("a".repeat(44)), false);
  assert.equal(isValidToken("a".repeat(42) + "!"), false);
});

test("secret hashing verifies correct passwords and rejects wrong ones", () => {
  const stored = hashSecret("correct horse battery staple");
  assert.equal(verifySecret("correct horse battery staple", stored), true);
  assert.equal(verifySecret("wrong password", stored), false);
});

test("access grants are bound to token hash and expiry", () => {
  process.env.ACCESS_SESSION_SECRET = "test-only-secret";
  const tokenHash = hashToken(generateToken());
  const expiresAt = new Date(Date.now() + 60_000);
  const grant = createAccessGrant(tokenHash, expiresAt);

  assert.equal(verifyAccessGrant(tokenHash, expiresAt, grant), true);
  assert.equal(verifyAccessGrant(hashToken(generateToken()), expiresAt, grant), false);
  assert.equal(verifyAccessGrant(tokenHash, new Date(expiresAt.getTime() + 1), grant), false);
});
