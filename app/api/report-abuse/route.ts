import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRateLimit } from "@/lib/rate-limit";
import { getClientKey } from "@/lib/token";
import { isAllowedOrigin } from "@/lib/origin";
import { isValidReportEmail } from "@/lib/email-validation";

const CATEGORIES = new Set(["illegal", "harassment", "copyright", "malware", "privacy", "other"]);
function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return response({ error: "Forbidden." }, 403);
  if (!(await allowRateLimit("abuse:" + getClientKey(request), 5, 60 * 60_000))) return response({ error: "Too many reports. Try again later." }, 429);
  const form = await request.formData();
  const shareUrl = String(form.get("shareUrl") ?? "").trim();
  const category = String(form.get("category") ?? "other").trim();
  const email = String(form.get("email") ?? "").trim();
  const details = String(form.get("details") ?? "").trim();
  try {
    const parsed = new URL(shareUrl);
    if (!/^https?:$/.test(parsed.protocol) || !parsed.pathname.startsWith("/s/")) return response({ error: "Enter a valid Moog share URL." }, 400);
  } catch { return response({ error: "Enter a valid Moog share URL." }, 400); }
  if (!CATEGORIES.has(category) || details.length < 10 || details.length > 5000 || email.length > 254) return response({ error: "Please complete the report fields." }, 400);
  if (email && !isValidReportEmail(email)) return response({ error: "Enter a valid email address or leave it blank." }, 400);
  await prisma.abuseReport.create({ data: { shareUrl, category, email: email || null, details } });
  return response({ ok: true }, 201);
}
