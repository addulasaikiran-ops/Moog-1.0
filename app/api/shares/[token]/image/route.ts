import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashToken, isValidToken, verifyAccessGrant } from "@/lib/token";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Params) {
  const { token } = await params;
  if (!isValidToken(token)) return new NextResponse("Not found", { status: 404 });
  const tokenHash = hashToken(token);
  const share = await prisma.share.findUnique({ where: { tokenHash } });

  if (!share || share.language !== "photo" || !share.imageData || !share.imageMime || share.expiresAt <= new Date()) {
    return new NextResponse("Not found", { status: 404 });
  }

  // View-once photos are rendered directly into the one-time page response.
  // This endpoint must never become a reusable bypass after reveal.
  if (share.viewOnce) return new NextResponse("Not found", { status: 404 });

  const cookieStore = await cookies();
  const grant = cookieStore.get(`moog_access_${token}`)?.value;
  const unlocked = !share.passwordHash || (!!grant && verifyAccessGrant(tokenHash, share.expiresAt, grant));
  if (!unlocked) return new NextResponse("Forbidden", { status: 403 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const headers = new Headers({
    "Content-Type": share.imageMime,
    "Content-Length": String(share.imageData.byteLength),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(share.imageName || "image")}`,
  });

  return new NextResponse(Buffer.from(share.imageData), { status: 200, headers });
}
