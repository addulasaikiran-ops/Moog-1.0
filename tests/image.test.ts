import test from "node:test";
import assert from "node:assert/strict";
import { IMAGE_TYPES, MAX_IMAGE_SIZE, hasValidImageSignature } from "../lib/image.ts";

test("allows only the supported image MIME types", () => {
  assert.equal(IMAGE_TYPES.has("image/jpeg"), true);
  assert.equal(IMAGE_TYPES.has("image/png"), true);
  assert.equal(IMAGE_TYPES.has("image/gif"), true);
  assert.equal(IMAGE_TYPES.has("image/webp"), true);
  assert.equal(IMAGE_TYPES.has("image/svg+xml"), false);
});

test("checks JPEG, PNG, GIF, and WebP signatures", () => {
  assert.equal(hasValidImageSignature(Uint8Array.from([0xff,0xd8,0xff,0x00]), "image/jpeg"), true);
  assert.equal(hasValidImageSignature(Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), "image/png"), true);
  assert.equal(hasValidImageSignature(new TextEncoder().encode("GIF89a"), "image/gif"), true);
  assert.equal(hasValidImageSignature(new TextEncoder().encode("RIFFxxxxWEBP"), "image/webp"), true);
});

test("rejects spoofed image signatures", () => {
  assert.equal(hasValidImageSignature(new TextEncoder().encode("not-a-jpeg"), "image/jpeg"), false);
  assert.equal(hasValidImageSignature(new TextEncoder().encode("GIF89a"), "image/png"), false);
  assert.equal(hasValidImageSignature(new TextEncoder().encode("RIFFxxxxNOPE"), "image/webp"), false);
});

test("keeps the image limit at 10 MB", () => {
  assert.equal(MAX_IMAGE_SIZE, 10 * 1024 * 1024);
});
