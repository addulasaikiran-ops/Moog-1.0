import test from "node:test";
import assert from "node:assert/strict";
import { isValidReportEmail } from "../lib/email-validation.ts";

test("accepts common valid email addresses", () => {
  for (const email of ["person@example.com", "first.last+tag@example.co.uk", "a@b.io"]) {
    assert.equal(isValidReportEmail(email), true, email);
  }
});

test("rejects missing parts, whitespace, and multiple separators", () => {
  for (const email of ["", "plain-text", "@example.com", "person@", "person @example.com", "person@ example.com", "person@example", "person@@example.com", "person@example..com"]) {
    assert.equal(isValidReportEmail(email), false, email);
  }
});
