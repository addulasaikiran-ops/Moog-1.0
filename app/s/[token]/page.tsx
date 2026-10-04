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
    <main className="viewerPage viewerMinimal">
      <div className="viewerShell">
        <header className="viewerTopbar">
          <a className="minimalLogo" href="/">moog</a>
          <a className="newShareLink" href="/">New share <span>→</span></a>
        </header>

        <main className="viewerMain">
          <article className={"minimalCard minimalCard-" + share.language}>
            <div className="timeLine" />
            <div className="minimalMeta">
              <span>
                {share.language === "photo"
                  ? "PHOTO"
                  : share.language === "text"
                    ? "TEXT"
                    : share.language.toUpperCase()}
                {" · "}
                {share.language === "photo" ? "SHARED IMAGE" : share.text.length.toLocaleString() + " CHARS"}
              </span>
              <Countdown expiresAt={share.expiresAt.toISOString()} />
            </div>

            <div className="minimalContent">
              {share.language === "photo" ? (
                <div className="minimalPhoto">
                  <img src={"/api/shares/" + token + "/image"} alt={share.text || "Shared photo"} />
                  {share.text ? <p>{share.text}</p> : null}
                </div>
              ) : share.language === "text" ? (
                <p className="minimalText">{share.text}</p>
              ) : (
                <CodeViewer text={share.text} language={share.language} />
              )}
            </div>

            <div className="minimalActions">
              <div className="minimalActionGroup">
                {share.language === "photo" ? (
                  <a className="minimalAction primaryAction" href={"/api/shares/" + token + "/image?download=1"}>Download</a>
                ) : (
                  <span className="minimalActionNote">{share.viewOnce ? "View once" : "Private share"}</span>
                )}
              </div>
              <a className="minimalNewShare" href="/">New share <span>→</span></a>
            </div>
          </article>
        </main>

        <footer className="minimalFooter">moog · private, temporary sharing</footer>
      </div>
    </main>
  );
}
