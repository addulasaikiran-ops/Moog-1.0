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
        <section className="card">
          <p className="shareText">{share.text}</p>
          <p className="expiry">Expires {share.expiresAt.toLocaleString()}</p>
        </section>
      </div>
    </main>
  );
}