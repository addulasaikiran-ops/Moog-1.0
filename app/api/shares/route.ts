import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/token";

const EXPIRY_OPTIONS = new Set([15, 60]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: unknown; expiryMinutes?: unknown };

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

    const token = generateToken();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await prisma.share.create({
      data: {
        text: body.text,
        tokenHash: hashToken(token),
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