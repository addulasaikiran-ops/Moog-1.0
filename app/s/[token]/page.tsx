import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const share = await prisma.share.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!share || share.expiresAt <= new Date()) {
    notFound();
  }

  return (
    <main className="sharePage">
      <div className="container">
        <header className="shareHeader">
          <a className="logo" href="/" aria-label="Moog home">
            <span className="logoMark">M</span>
            <span>moog</span>
          </a>
          <span className="badge"><span className="pulse" /> private link</span>
        </header>

        <section className="shareCard card">
          <div className="shareMeta">
            <span>SHARED MESSAGE</span>
            <span>READ ONLY</span>
          </div>
          <p className="shareText">{share.text}</p>
          <p className="expiry">This link expires {share.expiresAt.toLocaleString()}.</p>
        </section>
      </div>
    </main>
  );
}
