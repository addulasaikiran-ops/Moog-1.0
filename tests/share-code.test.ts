import test from "node:test";
import assert from "node:assert/strict";
import { formatShareCode, generateShareCode, hashShareCode, normalizeShareCode } from "../lib/share-code.ts";

test("normalizes codes with spaces, dashes, and lowercase", () => {
  assert.equal(normalizeShareCode(" mg-7k4q - 92xf "), "MG7K4Q92XF");
  assert.equal(formatShareCode(normalizeShareCode(" mg-7k4q - 92xf ")), "MG-7K4Q-92XF");
});

test("generates an eight-character code with an unambiguous alphabet", () => {
  const code = generateShareCode();
  assert.match(code, /^MG-[A-HJ-MNP-Z2-9]{4}-[A-HJ-MNP-Z2-9]{4}$/);
  assert.ok(!/[01ILO]/.test(code));
});

test("hashes equivalent code spellings to the same HMAC", () => {
  const a = hashShareCode("MG-7K4Q-92XF", "test-secret");
  const b = hashShareCode(" mg 7k4q 92xf ", "test-secret");
  assert.equal(a, b);
  assert.notEqual(a, hashShareCode("MG-7K4Q-92XF", "other-secret"));
});