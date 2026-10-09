import assert from "node:assert/strict";
import testCase from "node:test";
import { isValidEmail } from "../lib/validation.ts";

testCase("accepts ordinary email addresses", () => {
  assert.equal(isValidEmail("person@example.com"), true);
  assert.equal(isValidEmail("first.last+tag@example.co.in"), true);
});

testCase("rejects missing or whitespace-separated email parts", () => {
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail("personexample.com"), false);
  assert.equal(isValidEmail("person@"), false);
  assert.equal(isValidEmail("person @example.com"), false);
  assert.equal(isValidEmail("person@example .com"), false);
});
