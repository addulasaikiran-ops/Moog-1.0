import test from "node:test";
import assert from "node:assert/strict";
import { formatShareCode, generateShareCode, hashShareCode, normalizeShareCode } from "../lib/share-code.ts";

test("normalizes codes to six digits", () => {
  assert.equal(normalizeShareCode(" 12-34 56 "), "123456");
  assert.equal(formatShareCode(normalizeShareCode("12 34 56")), "123456");
});

test("generates a six-digit numeric code", () => {
  const code = generateShareCode();
  assert.match(code, /^\d{6}$/);
});

test("hashes equivalent numeric code spellings to the same HMAC", () => {
  const a = hashShareCode("123456", "test-secret");
  const b = hashShareCode("12-34 56", "test-secret");
  assert.equal(a, b);
  assert.notEqual(a, hashShareCode("123456", "other-secret"));
});
