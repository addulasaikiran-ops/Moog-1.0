import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRateLimit, allowRateLimitCost } from "@/lib/rate-limit";
import { generateShareCode, hashShareCode } from "@/lib/share-code";
import { deriveShareToken, generateToken, getClientKey, hashSecret, hashToken } from "@/lib/token";
import { IMAGE_TYPES, MAX_IMAGE_SIZE, hasValidImageSignature, sanitizeImage } from "@/lib/image";
import { isAllowedOrigin } from "@/lib/origin";

const EXPIRY_OPTIONS = new Set([1, 5, 15, 30, 60, 360, 1440, 4320, 10080]);
const LANGUAGE_OPTIONS = new Set(["text", "javascript", "typescript", "python", "html", "css", "json", "sql", "bash", "java", "csharp", "cpp", "go", "rust", "php", "markdown"]);
const MAX_MULTIPART_BODY = MAX_IMAGE_SIZE + 128 * 1024;
const MAX_JSON_BODY = 256 * 1024;
const CREATION_LIMIT = 20;
const CREATION_WINDOW_MS = 60_000;

function getExpiry(value: FormDataEntryValue | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && EXPIRY_OPTIONS.has(parsed) ? parsed : 60;
}
function bodyTooLarge(request: Request, maxBytes: number): boolean {
  const length = request.headers.get("content-length");
  return length !== null && Number.isFinite(Number(length)) && Number(length) > maxBytes;
}
function isUniqueConstraint(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002";
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: "Forbidden." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  try {
    const isMultipart = (request.headers.get("content-type") ?? "").includes("multipart/form-data");
    if (bodyTooLarge(request, isMultipart ? MAX_MULTIPART_BODY : MAX_JSON_BODY)) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    await prisma.share.deleteMany({ where: { expiresAt: { lte: new Date() } } });
    if (!(await allowRateLimit("create:" + getClientKey(request), CREATION_LIMIT, CREATION_WINDOW_MS))) return NextResponse.json({ error: "Too many links created. Try again in a minute." }, { status: 429 });

    let text = "", language = "text", password = "", viewOnce = false;
    let imageData: Uint8Array<ArrayBuffer> | null = null, imageMime: string | null = null, imageName: string | null = null, minutes = 60;

    if (isMultipart) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Image is required." }, { status: 400 });
      if (!IMAGE_TYPES.has(file.type)) return NextResponse.json({ error: "Use JPG, PNG, GIF, or WebP." }, { status: 400 });
      if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: "Image must be 10 MB or smaller." }, { status: 413 });
      const bytes = new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>;
      if (!hasValidImageSignature(bytes, file.type)) return NextResponse.json({ error: "The uploaded file does not match its image type." }, { status: 400 });
      const sanitized = await sanitizeImage(bytes, file.type);
      if (sanitized.byteLength > MAX_IMAGE_SIZE) return NextResponse.json({ error: "Processed image must be 10 MB or smaller." }, { status: 413 });
      imageData = new Uint8Array(sanitized) as Uint8Array<ArrayBuffer>;
      imageMime = file.type;
      imageName = (file.name || "image").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
      text = typeof form.get("text") === "string" ? String(form.get("text")).slice(0, 1000) : "";
      password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
      viewOnce = form.get("viewOnce") === "true"; minutes = getExpiry(form.get("expiryMinutes")); language = "photo";
    } else {
      const rawBody = await request.text();
      if (new TextEncoder().encode(rawBody).byteLength > MAX_JSON_BODY) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
      const body = JSON.parse(rawBody) as { text?: unknown; expiryMinutes?: unknown; password?: unknown; viewOnce?: unknown; language?: unknown };
      if (typeof body.text !== "string" || !body.text.trim()) return NextResponse.json({ error: "Text cannot be empty." }, { status: 400 });
      if (body.text.length > 100000) return NextResponse.json({ error: "Text is too long." }, { status: 413 });
      language = typeof body.language === "string" && LANGUAGE_OPTIONS.has(body.language) ? body.language : "text";
      password = typeof body.password === "string" ? body.password : "";
      viewOnce = body.viewOnce === true;
      minutes = typeof body.expiryMinutes === "number" && EXPIRY_OPTIONS.has(body.expiryMinutes) ? body.expiryMinutes : 60;
      text = body.text;
    }

    if (password.length > 128) return NextResponse.json({ error: "Password is too long." }, { status: 400 });

    const storedBytes = new TextEncoder().encode(text).byteLength + (imageData?.byteLength ?? 0);
    const storageUnits = Math.max(1, Math.ceil(storedBytes / 1024));
    if (!(await allowRateLimitCost("storage-day:" + getClientKey(request), 100 * 1024, 24 * 60 * 60_000, storageUnits))) {
      return NextResponse.json({ error: "Daily sharing limit reached. Try again tomorrow." }, { status: 429, headers: { "Cache-Control": "no-store" } });
    }

    const id = generateToken();
    const token = deriveShareToken(id);
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    let rawCode = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      rawCode = generateShareCode();
      try {
        await prisma.share.create({
          data: {
            id,
            text, language, imageData, imageMime, imageName,
            tokenHash: hashToken(token),
            codeHash: hashShareCode(rawCode),
            passwordHash: password ? hashSecret(password) : null,
            viewOnce, expiresAt,
          },
        });
        break;
      } catch (error) {
        if (isUniqueConstraint(error) && attempt < 4) continue;
        throw error;
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    return NextResponse.json({
      url: new URL(`/s/${token}`, baseUrl).toString(),
      code: rawCode,
      expiresAt: expiresAt.toISOString(),
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to create share.");
    return NextResponse.json({ error: "Could not create link." }, { status: 500 });
  }
}