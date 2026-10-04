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
    <main className="viewerPage">
      <div className="viewerGlow viewerGlowOne" />
      <div className="viewerGlow viewerGlowTwo" />

      <div className="viewerShell">
        <header className="viewerTopbar">
          <a className="logo" href="/" aria-label="Moog home">
            <span className="logoMark">M</span>
            <span>moog</span>
          </a>
          <span className="viewerStatus">
            <span className="pulse" /> private & temporary
          </span>
        </header>

        <section className="viewerIntro">
          <div className="viewerEyebrow">A MESSAGE WAS SHARED WITH YOU</div>
          <h1>Take a moment.<br /><span>Read it before it disappears.</span></h1>
        </section>

        <article className="viewerCard">
          <div className="viewerCardTop">
            <div>
              <span className="viewerLabel">SHARED MESSAGE</span>
              <p className="viewerHint">Read only · no account required</p>
            </div>
            <div className="viewerLock" aria-hidden="true">↗</div>
          </div>

          <div className="viewerMessage">
            <div className="quoteMark">“</div>
            <p>{share.text}</p>
          </div>

          <div className="viewerFooter">
            <div>
              <span className="viewerLabel">EXPIRES</span>
              <strong>{share.expiresAt.toLocaleString()}</strong>
            </div>
            <a className="viewerCreate" href="/">Create a temporary message <span>→</span></a>
          </div>
        </article>

        <footer className="viewerBottom">
          <span>moog</span>
          <span>temporary text, intentionally temporary.</span>
        </footer>
      </div>
    </main>
  );
}
