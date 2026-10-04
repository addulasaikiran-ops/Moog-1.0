import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashToken, verifyAccessGrant } from "@/lib/token";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Params) {
  const { token } = await params;
  const tokenHash = hashToken(token);
  const share = await prisma.share.findUnique({ where: { tokenHash } });

  if (!share || share.language !== "photo" || !share.imageData || !share.imageMime || share.expiresAt <= new Date()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const cookieStore = await cookies();
  const grant = cookieStore.get("moog_access")?.value;
  const unlocked = !share.passwordHash || (!!grant && verifyAccessGrant(tokenHash, share.expiresAt, grant));
  if (!unlocked) return new NextResponse("Forbidden", { status: 403 });

  if (share.viewOnce) {
    const claimed = await prisma.share.updateMany({
      where: { id: share.id, viewedAt: null, expiresAt: { gt: new Date() } },
      data: { viewedAt: new Date() },
    });
    if (claimed.count !== 1) return new NextResponse("Not found", { status: 404 });
  }

  const download = new URL(request.url).searchParams.get("download") === "1";
  const headers = new Headers({
    "Content-Type": share.imageMime,
    "Content-Length": String(share.imageData.byteLength),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": share.viewOnce ? "no-store" : "private, max-age=300",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(share.imageName || "image")}`,
  });

  return new NextResponse(Buffer.from(share.imageData), { status: 200, headers });
}
