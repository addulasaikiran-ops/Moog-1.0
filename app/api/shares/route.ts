import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, getClientKey, hashSecret, hashToken } from "@/lib/token";

const EXPIRY_OPTIONS = new Set([1, 5, 15, 30, 60, 360, 1440]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const CREATION_LIMIT = 20;
const CREATION_WINDOW_MS = 60_000;
const creationWindows = new Map<string, { startedAt: number; count: number }>();

function allowCreation(key: string): boolean {
  const now = Date.now();
  const current = creationWindows.get(key);
  if (!current || now - current.startedAt >= CREATION_WINDOW_MS) {
    creationWindows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= CREATION_LIMIT) return false;
  current.count += 1;
  return true;
}

function getExpiry(value: FormDataEntryValue | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && EXPIRY_OPTIONS.has(parsed) ? parsed : 60;
}

export async function POST(request: Request) {
  try {
    if (!allowCreation(getClientKey(request))) {
      return NextResponse.json({ error: "Too many links created. Try again in a minute." }, { status: 429 });
    }

    const isMultipart = (request.headers.get("content-type") ?? "").includes("multipart/form-data");
    let text = "";
    let language = "text";
    let password = "";
    let viewOnce = false;
    let imageData: Uint8Array<ArrayBuffer> | null = null;
    let imageMime: string | null = null;
    let imageName: string | null = null;
    let minutes = 60;

    if (isMultipart) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Image is required." }, { status: 400 });
      if (!IMAGE_TYPES.has(file.type)) return NextResponse.json({ error: "Use JPG, PNG, GIF, or WebP." }, { status: 400 });
      if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: "Image must be 10 MB or smaller." }, { status: 413 });

      imageData = new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>;
      imageMime = file.type;
      imageName = file.name || "image";
      text = typeof form.get("text") === "string" ? String(form.get("text")).slice(0, 1000) : "";
      password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
      viewOnce = form.get("viewOnce") === "true";
      minutes = getExpiry(form.get("expiryMinutes"));
      language = "photo";
    } else {
      const body = (await request.json()) as { text?: unknown; expiryMinutes?: unknown; password?: unknown; viewOnce?: unknown; language?: unknown };
      if (typeof body.text !== "string" || !body.text.trim()) return NextResponse.json({ error: "Text cannot be empty." }, { status: 400 });
      if (body.text.length > 100000) return NextResponse.json({ error: "Text is too long." }, { status: 413 });

      const languageOptions = new Set(["text", "javascript", "typescript", "python", "html", "css", "json", "sql", "bash", "java", "csharp", "cpp", "go", "rust", "php", "markdown"]);
      language = typeof body.language === "string" && languageOptions.has(body.language) ? body.language : "text";
      password = typeof body.password === "string" ? body.password : "";
      viewOnce = body.viewOnce === true;
      minutes = typeof body.expiryMinutes === "number" && EXPIRY_OPTIONS.has(body.expiryMinutes) ? body.expiryMinutes : 60;
      text = body.text;
    }

    if (password.length > 128) return NextResponse.json({ error: "Password is too long." }, { status: 400 });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    await prisma.share.create({
      data: { text, language, imageData, imageMime, imageName, tokenHash: hashToken(token), passwordHash: password ? hashSecret(password) : null, viewOnce, expiresAt },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    return NextResponse.json({ url: new URL(`/s/${token}`, baseUrl).toString(), expiresAt: expiresAt.toISOString() }, { status: 201 });
  } catch (error) {
    console.error("Failed to create share:", error);
    return NextResponse.json({ error: "Could not create link." }, { status: 500 });
  }
}
