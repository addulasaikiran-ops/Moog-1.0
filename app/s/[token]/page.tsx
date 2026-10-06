import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashToken, isValidToken, verifyAccessGrant } from "@/lib/token";
import Countdown from "./Countdown";
import CodeViewer from "./CodeViewer";
import ViewOnceContent from "./ViewOnceContent";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> };

export default async function SharePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { error } = await searchParams;
  if (!isValidToken(token)) notFound();
  const tokenHash = hashToken(token);
  const share = await prisma.share.findUnique({ where: { tokenHash } });

  if (!share || share.revokedAt || share.expiresAt <= new Date()) notFound();

  const cookieStore = await cookies();
  const grant = cookieStore.get(`moog_access_${token}`)?.value;
  const revealGrant = cookieStore.get(`moog_reveal_${token}`)?.value;
  const unlocked = !share.passwordHash || (!!grant && verifyAccessGrant(tokenHash, share.expiresAt, grant));
  const revealed = !share.viewOnce || (!!revealGrant && verifyAccessGrant(tokenHash, share.expiresAt, revealGrant));

  if (share.viewOnce && share.viewedAt && !revealed) notFound();

  if (!unlocked) {
    return (
      <main className="viewerPage viewerMinimal viewerLockedPage">
        <div className="viewerShell">
          <header className="viewerTopbar">
            <a className="minimalLogo" href="/">moog</a>
            <span className="viewerSecure"><span className="lockDot">⌁</span> private link</span>
          </header>
          <section className="lockStage">
            <div className="lockIcon">↗</div>
            <div className="viewerEyebrow">PASSWORD PROTECTED</div>
            <h1>This link is private.</h1>
            <p>Enter the password to reveal what was shared with you.</p>
            <section className="minimalCard passwordCard">
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

  if (share.viewOnce && !revealed) {
    return (
      <main className="viewerPage viewerMinimal">
        <div className="viewerShell">
          <header className="viewerTopbar">
            <a className="minimalLogo" href="/">moog</a>
            <span className="viewerSecure">private link</span>
          </header>
          <main className="viewerMain">
            <section className="minimalCard revealCard">
              <div className="revealContent">
                <div className="revealEyebrow">VIEW ONCE</div>
                <h1>Ready to reveal.</h1>
                <p>This share can be opened once. Reveal it when you are ready to read it.</p>
                <form action={`/api/shares/${token}/reveal`} method="post">
                  <button className="minimalRevealButton" type="submit">Reveal <span>→</span></button>
                </form>
              </div>
            </section>
          </main>
          <footer className="minimalFooter">moog · private, temporary sharing</footer>
        </div>
      </main>
    );
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

            {share.viewOnce ? (
              <ViewOnceContent token={token} />
            ) : (
              <>
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
                      <span className="minimalActionNote">Private share</span>
                    )}
                  </div>
                  <a className="minimalNewShare" href="/">New share <span>→</span></a>
                </div>
              </>
            )}
          </article>
        </main>

        <footer className="minimalFooter">moog · private, temporary sharing</footer>
      </div>
    </main>
  );
}
