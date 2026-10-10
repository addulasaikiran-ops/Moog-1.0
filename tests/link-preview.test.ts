import assert from "node:assert/strict";
import test from "node:test";
import { isPublicAddress, isPublicIPv4 } from "../app/api/link-preview/route.ts";

test("rejects private, loopback, link-local, and special-use IPv4 addresses", () => {
  for (const address of [
    "0.0.0.0", "10.1.2.3", "100.64.0.1", "127.0.0.1", "169.254.1.1",
    "172.16.0.1", "192.168.1.1", "192.0.2.1", "198.18.0.1",
    "198.51.100.1", "203.0.113.1", "224.0.0.1", "255.255.255.255",
  ]) assert.equal(isPublicIPv4(address), false, address);
});

test("accepts ordinary public IPv4 addresses", () => {
  for (const address of ["1.1.1.1", "8.8.8.8", "93.184.216.34"]) {
    assert.equal(isPublicIPv4(address), true, address);
  }
});

test("rejects non-global and special-use IPv6 addresses", () => {
  for (const address of [
    "::", "::1", "fc00::1", "fd12::1", "fe80::1", "ff02::1",
    "::ffff:8.8.8.8", "2001:db8::1", "2001:0::1", "2002::1", "2001:10::1",
  ]) assert.equal(isPublicAddress(address), false, address);
});

test("accepts global-unicast IPv6 addresses", () => {
  for (const address of ["2606:4700:4700::1111", "2001:4860:4860::8888"]) {
    assert.equal(isPublicAddress(address), true, address);
  }
});
