import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashToken, verifyAccessGrant } from "@/lib/token";
import Countdown from "./Countdown";
import CodeViewer from "./CodeViewer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> };

export default async function SharePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { error } = await searchParams;
  const tokenHash = hashToken(token);
  const share = await prisma.share.findUnique({ where: { tokenHash } });

  if (!share || share.expiresAt <= new Date() || (share.viewOnce && share.viewedAt)) notFound();

  const cookieStore = await cookies();
  const grant = cookieStore.get("moog_access")?.value;
  const unlocked = !share.passwordHash || (!!grant && verifyAccessGrant(tokenHash, share.expiresAt, grant));

  if (!unlocked) {
    return (
      <main className="viewerPage viewerLockedPage">
        <div className="viewerGlow viewerGlowOne" />
        <div className="viewerShell">
          <header className="viewerTopbar">
            <a className="logo" href="/"><span className="logoMark">M</span><span>moog</span></a>
            <span className="viewerSecure"><span className="lockDot">⌁</span> private link</span>
          </header>
          <section className="lockStage">
            <div className="lockIcon">↗</div>
            <div className="viewerEyebrow">PASSWORD PROTECTED</div>
            <h1>This link is private.</h1>
            <p>Enter the password to reveal what was shared with you.</p>
            <section className="viewerCard passwordCard">
              <div className="lockForm">
                <form action={"/api/shares/" + token + "/unlock"} method="post">
                  <label className="viewerLabel" htmlFor="password">ACCESS PASSWORD</label>
                  <div className="passwordRow">
                    <input className="passwordInput" id="password" name="password" type="password" placeholder="Enter password" autoFocus required />
                    <button className="primary" type="submit">Unlock <span>→</span></button>
                  </div>
                  {error === "invalid" ? <p className="passwordError" role="alert">That password is not correct.</p> : null}
                  {error === "missing" ? <p className="passwordError" role="alert">Enter the password to continue.</p> : null}
                </form>
              </div>
            </section>
            <div className="lockNote">No account required · Access is temporary</div>
          </section>
        </div>
      </main>
    );
  }

  if (share.viewOnce && share.language !== "photo") {
    const claimed = await prisma.share.updateMany({ where: { id: share.id, viewedAt: null }, data: { viewedAt: new Date() } });
    if (claimed.count !== 1) notFound();
  }

  return (
    <main className="viewerPage"><div className="viewerGlow viewerGlowOne" /><div className="viewerGlow viewerGlowTwo" />
      <div className="viewerShell">
        <header className="viewerTopbar"><a className="logo" href="/"><span className="logoMark">M</span><span>moog</span></a>
          <span className="viewerStatus"><span className="pulse" /> {share.viewOnce ? "view once" : "private & temporary"}</span>
        </header>
        <section className="viewerIntro viewerIntroCompact">
          <div className="viewerIntroLine">
            <div>
              <div className="viewerEyebrow">{share.viewOnce ? "ONE-TIME" : "PRIVATE LINK"}</div>
              <h1>{share.viewOnce ? "Read it once." : "Shared with you."}</h1>
            </div>
            <div className="viewerExpiryBadge"><span className="pulse" /> {share.viewOnce ? "view once" : "temporary"}</div>
          </div>
        </section>
        <article className="viewerCard viewerContentCard">
          <div className="viewerCardTop">
            <div>
              <span className="viewerLabel">{share.language === "photo" ? "SHARED PHOTO" : share.language === "text" ? "SHARED MESSAGE" : "SHARED " + share.language.toUpperCase() + " CODE"}</span>
              <p className="viewerHint">Read only · no account required</p>
            </div>
            <div className="viewerType">{share.language === "photo" ? "PHOTO" : share.language === "text" ? "TEXT" : share.language.toUpperCase()}</div>
          </div>
          <div className="viewerMessage">
            {share.language === "photo" ? (
              <div className="sharedPhotoWrap">
                <img className="sharedPhoto" src={"/api/shares/" + token + "/image"} alt={share.text || "Shared photo"} />
                {share.text ? <p className="photoCaptionView">{share.text}</p> : null}
                <a className="photoDownload" href={"/api/shares/" + token + "/image?download=1"}>Download photo <span>↓</span></a>
              </div>
            ) : share.language === "text" ? (
              <div className="messageText"><div className="quoteMark">“</div><p>{share.text}</p></div>
            ) : (
              <CodeViewer text={share.text} language={share.language} />
            )}
          </div>
          <div className="viewerFooter">
            <div className="expiryBlock">
              <span className="viewerLabel">EXPIRES</span>
              <Countdown expiresAt={share.expiresAt.toISOString()} />
              <span className="expiryDate">{share.expiresAt.toLocaleString()}</span>
            </div>
            <a className="viewerCreate" href="/">Create a temporary message <span>→</span></a>
          </div>
        </article>
        <footer className="viewerBottom"><span>moog</span><span>temporary text, intentionally temporary.</span></footer>
      </div>
    </main>
  );
}
