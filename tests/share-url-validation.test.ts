import assert from "node:assert/strict";
import testCase from "node:test";
import { isValidMoogShareUrl } from "../lib/validation.ts";

const token = "a".repeat(43);
const trustedOrigin = "https://moog.example";

testCase("accepts share links on a trusted Moog origin", () => {
  assert.equal(isValidMoogShareUrl(`${trustedOrigin}/s/${token}`, [trustedOrigin]), true);
  assert.equal(isValidMoogShareUrl(`${trustedOrigin}/s/${token}/`, [trustedOrigin]), true);
});

testCase("rejects non-Moog hosts, malformed paths, and unsafe URLs", () => {
  assert.equal(isValidMoogShareUrl(`https://attacker.example/s/${token}`, [trustedOrigin]), false);
  assert.equal(isValidMoogShareUrl(`javascript:alert(1)`, [trustedOrigin]), false);
  assert.equal(isValidMoogShareUrl(`${trustedOrigin}/s/${token}/extra`, [trustedOrigin]), false);
  assert.equal(isValidMoogShareUrl(`${trustedOrigin}/s/short`, [trustedOrigin]), false);
  assert.equal(isValidMoogShareUrl(`https://user:pass@moog.example/s/${token}`, [trustedOrigin]), false);
  assert.equal(isValidMoogShareUrl(`https://moog.example.attacker.test/s/${token}`, [trustedOrigin]), false);
  assert.equal(isValidMoogShareUrl(`https://moog.example:8443/s/${token}`, [trustedOrigin]), false);
  assert.equal(isValidMoogShareUrl(`${trustedOrigin}/s/${token}`, []), false);
});
