import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, getClientKey, hashSecret, hashToken } from "@/lib/token";

const EXPIRY_OPTIONS = new Set([1, 5, 15, 30, 60, 360, 1440]);
const creationWindows = new Map<string, { startedAt: number; count: number }>();
const CREATION_LIMIT = 20;
const CREATION_WINDOW_MS = 60_000;

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

export async function POST(request: Request) {
  try {
    if (!allowCreation(getClientKey(request))) {
      return NextResponse.json({ error: "Too many links created. Try again in a minute." }, { status: 429 });
    }

    const body = (await request.json()) as { text?: unknown; expiryMinutes?: unknown; password?: unknown; viewOnce?: unknown; language?: unknown };

    if (typeof body.text !== "string") {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    if (!body.text.trim()) {
      return NextResponse.json({ error: "Text cannot be empty." }, { status: 400 });
    }

    if (body.text.length > 100000) {
      return NextResponse.json({ error: "Text is too long." }, { status: 413 });
    }

    const expiryMinutes =
      typeof body.expiryMinutes === "number" && EXPIRY_OPTIONS.has(body.expiryMinutes)
        ? body.expiryMinutes
        : 60;

    const password = typeof body.password === "string" ? body.password : "";
    const languageOptions = new Set(["text", "javascript", "typescript", "python", "html", "css", "json", "sql", "bash", "java", "csharp", "cpp", "go", "rust", "php", "markdown"]);
    const language = typeof body.language === "string" && languageOptions.has(body.language) ? body.language : "text";
    if (password.length > 128) return NextResponse.json({ error: "Password is too long." }, { status: 400 });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await prisma.share.create({
      data: {
        text: body.text,
        language,
        tokenHash: hashToken(token),
        passwordHash: password ? hashSecret(password) : null,
        viewOnce: body.viewOnce === true,
        expiresAt,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

    return NextResponse.json(
      { url: new URL(`/s/${token}`, baseUrl).toString(), expiresAt: expiresAt.toISOString() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create share:", error);
    return NextResponse.json(
      { error: "Could not create link." },
      { status: 500 }
    );
  }
}