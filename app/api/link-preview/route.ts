import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HTML_BYTES = 512 * 1024;
const TIMEOUT_MS = 4500;
const USER_AGENT = "MoogLinkPreview/1.0 (+https://github.com/addulasaikiran-ops/Moog-1.0)";

function isPublicIPv4(ip: string): boolean {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = octets;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || (b === 0 && c === 0) || (b === 0 && c === 2) || (b === 88 && c === 99)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}

function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isPublicIPv4(address);
  if (family === 6) {
    const value = address.toLowerCase();
    // Permit globally routable unicast IPv6 only; reject mapped IPv4 and special-use ranges.
    return value.startsWith("2") || value.startsWith("3");
  }
  return false;
}

async function validatePublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Private hosts are not supported.");
  }
  const family = isIP(host);
  if (family) {
    if (!isPublicAddress(host)) throw new Error("Private addresses are not supported.");
    return;
  }
  const records = await lookup(host, { all: true, verbatim: true });
  if (!records.length || records.some((record) => !isPublicAddress(record.address))) {
    throw new Error("This host does not resolve to a public address.");
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

function getMeta(html: string, key: string): string {
  const tags = html.match(/<meta\\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const readAttribute = (name: string) => tag.match(new RegExp(`${name}\\\\s*=\\\\s*["']([^"']*)["']`, "i"))?.[1] ?? "";
    const property = readAttribute("property") || readAttribute("name");
    if (property.toLowerCase() === key.toLowerCase()) {
      const value = readAttribute("content");
      if (value) return decodeEntities(value.trim()).slice(0, 500);
    }
  }
  return "";
}
function getTitle(html: string): string {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);
  return match?.[1] ? decodeEntities(match[1].replace(/<[^>]+>/g, "").trim()).slice(0, 180) : "";
}

function absoluteHttpUrl(value: string, base: string): string | null {
  try {
    const parsed = new URL(value, base);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    return parsed.toString().slice(0, 2048);
  } catch {
    return null;
  }
}

async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_HTML_BYTES) {
        await reader.cancel();
        throw new Error("Page is too large to preview.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw || raw.length > 2048) return NextResponse.json({ error: "Provide a valid URL." }, { status: 400 });

  let current: URL;
  try {
    current = new URL(raw);
    if (current.protocol !== "https:" || current.username || current.password) throw new Error("Use a public HTTPS URL.");
  } catch {
    return NextResponse.json({ error: "Only public HTTPS links can be previewed." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let response: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      await validatePublicHost(current.hostname);
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml;q=0.9" },
        cache: "no-store",
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location || hop === 3) throw new Error("Too many redirects.");
        const next = new URL(location, current);
        if (next.protocol !== "https:" || next.username || next.password) throw new Error("Unsafe redirect.");
        current = next;
        continue;
      }
      break;
    }
    if (!response || !response.ok || !response.headers.get("content-type")?.toLowerCase().includes("text/html")) {
      await response?.body?.cancel();
      return NextResponse.json({ error: "This link does not provide a previewable web page." }, { status: 422 });
    }
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_HTML_BYTES) {
      await response.body?.cancel();
      return NextResponse.json({ error: "Page is too large to preview." }, { status: 422 });
    }
    const html = await readLimited(response);
    const title = getMeta(html, "og:title") || getMeta(html, "twitter:title") || getTitle(html);
    const description = getMeta(html, "og:description") || getMeta(html, "twitter:description") || getMeta(html, "description");
    const imageRaw = getMeta(html, "og:image") || getMeta(html, "twitter:image");
    const image = imageRaw ? absoluteHttpUrl(imageRaw, current.toString()) : null;
    return NextResponse.json({
      url: current.toString(),
      domain: current.hostname,
      title: title || current.hostname,
      description,
      image,
    }, { headers: { "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Preview unavailable for this link." }, { status: 422 });
  } finally {
    clearTimeout(timeout);
  }
}
