import { notFound } from "next/navigation";
import { isValidToken } from "@/lib/token";
import RevokeClient from "./RevokeClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Revoke share — Moog 1.0",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ status?: string }> };

export default async function RevokePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { status } = await searchParams;
  if (!isValidToken(token)) notFound();

  if (status === "revoked") return <main className="viewerPage viewerMinimal viewerLockedPage"><div className="viewerShell"><RevokeClient token={token} expiresAt={new Date().toISOString()} /></div></main>;

  return (
    <main className="viewerPage viewerMinimal viewerLockedPage">
      <div className="viewerShell">
        <header className="viewerTopbar">
          <a className="minimalLogo" href="/">moog</a>
          <a className="newShareLink" href="/">New share <span>→</span></a>
        </header>
        <section className="lockStage">
          <div className="lockIcon">SHARE CONTROL</div>
          <div className="viewerEyebrow">{revoked ? "SHARE REVOKED" : "PRIVATE CONTROL LINK"}</div>
          <h1>{revoked ? "This share is no longer available." : "Revoke this share?"}</h1>
          <p>
            {revoked
              ? "The public share link has been permanently disabled."
              : unavailable
                ? "The share has already expired or was revoked."
                : "Revoking it will immediately disable the public link, including password-protected and view-once access."}
          </p>
          {!revoked && !unavailable ? (
            <section className="minimalCard passwordCard">
              <div className="lockForm">
                <div className="viewerLabel">LINK EXPIRES</div>
                <div className="expiryDate">{share.expiresAt.toLocaleString()}</div>
                <form
                  action={`/api/revokes/${token}`}
                  method="post"
                  style={{ marginTop: 16 }}
                  onSubmit={(event) => {
                    if (!window.confirm("Revoke this share now? Anyone currently viewing it will lose access.")) {
                      event.preventDefault();
                    }
                  }}
                >
                  <button className="primary" type="submit" style={{ width: "100%" }}>Revoke share <span>→</span></button>
                </form>
              </div>
            </section>
          ) : null}
          <div className="lockNote">Keep this private control link safe · No account required</div>
        </section>
      </div>
    </main>
  );
}
