import { notFound } from "next/navigation";
import { isValidToken } from "@/lib/token";
import RevokeClient from "./RevokeClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revoke share — Moog 1.0", robots: { index: false, follow: false } };
type Props = { params: Promise<{ token: string }> };

export default async function RevokePage({ params }: Props) {
  const { token } = await params;
  if (!isValidToken(token)) notFound();
  return <main className="viewerPage viewerMinimal viewerLockedPage"><div className="viewerShell"><RevokeClient token={token} expiresAt={new Date().toISOString()} /></div></main>;
}