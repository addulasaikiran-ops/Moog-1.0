import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashToken, verifySecret } from "@/lib/token";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ key?: string }> };

export default async function SharePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { key } = await searchParams;
  const share = await prisma.share.findUnique({ where: { tokenHash: hashToken(token) } });

  if (!share || share.expiresAt <= new Date() || (share.viewOnce && share.viewedAt)) notFound();

  if (share.passwordHash && (!key || !verifySecret(key, share.passwordHash))) {
    return (
      <main className="viewerPage"><div className="viewerShell">
        <header className="viewerTopbar"><a className="logo" href="/"><span className="logoMark">M</span><span>moog</span></a></header>
        <section className="viewerIntro"><div className="viewerEyebrow">PROTECTED MESSAGE</div><h1>Enter the password.<br /><span>Then read the message.</span></h1></section>
        <section className="viewerCard passwordCard"><div className="viewerMessage">
          <form method="get"><label className="viewerLabel" htmlFor="key">PASSWORD</label>
          <input className="passwordInput" id="key" name="key" type="password" placeholder="Enter password" autoFocus required />
          <button className="primary" type="submit">Unlock message →</button></form>
        </div></section>
      </div></main>
    );
  }

  if (share.viewOnce) {
    const claimed = await prisma.share.updateMany({ where: { id: share.id, viewedAt: null }, data: { viewedAt: new Date() } });
    if (claimed.count !== 1) notFound();
  }

  return (
    <main className="viewerPage"><div className="viewerGlow viewerGlowOne" /><div className="viewerGlow viewerGlowTwo" />
      <div className="viewerShell">
        <header className="viewerTopbar"><a className="logo" href="/"><span className="logoMark">M</span><span>moog</span></a>
          <span className="viewerStatus"><span className="pulse" /> {share.viewOnce ? "view once" : "private & temporary"}</span>
        </header>
        <section className="viewerIntro"><div className="viewerEyebrow">{share.viewOnce ? "ONE-TIME MESSAGE" : "A MESSAGE WAS SHARED WITH YOU"}</div>
          <h1>{share.viewOnce ? "Read it now." : "Take a moment."}<br /><span>{share.viewOnce ? "It won't be here again." : "Read it before it disappears."}</span></h1>
        </section>
        <article className="viewerCard"><div className="viewerCardTop"><div><span className="viewerLabel">SHARED MESSAGE</span><p className="viewerHint">Read only · no account required</p></div><div className="viewerLock">↗</div></div>
          <div className="viewerMessage"><div className="quoteMark">“</div><p>{share.text}</p></div>
          <div className="viewerFooter"><div><span className="viewerLabel">EXPIRES</span><strong>{share.expiresAt.toLocaleString()}</strong></div><a className="viewerCreate" href="/">Create a temporary message <span>→</span></a></div>
        </article>
        <footer className="viewerBottom"><span>moog</span><span>temporary text, intentionally temporary.</span></footer>
      </div>
    </main>
  );
}