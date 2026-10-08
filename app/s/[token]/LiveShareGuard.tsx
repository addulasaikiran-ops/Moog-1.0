"use client";

import { ReactNode, useEffect, useState } from "react";

const POLL_INTERVAL_MS = 2000;

export default function LiveShareGuard({
  token,
  children,
}: {
  token: string;
  children: ReactNode;
}) {
  const [available, setAvailable] = useState(true);
  const [disappearing, setDisappearing] = useState(false);

  useEffect(() => {
    let active = true;
    let timeoutId: number | undefined;
    let controller: AbortController | undefined;

    const check = async () => {
      controller = new AbortController();

      try {
        const response = await fetch(`/api/shares/${token}/status`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!active) return;

        if (!response.ok) {
          setDisappearing(true);
          window.setTimeout(() => { if (active) setAvailable(false); }, 680);
          return;
        }
      } catch {
        // Keep the current view on transient network errors; the next poll retries.
      } finally {
        controller = undefined;
      }

      if (active) {
        timeoutId = window.setTimeout(check, POLL_INTERVAL_MS);
      }
    };

    // Check immediately so revocation is detected without waiting for the first interval.
    void check();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && active) {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
          timeoutId = undefined;
        }
        controller?.abort();
        void check();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [token]);

  if (!available) {
    return (
      <main className="viewerPage viewerMinimal viewerLockedPage">
        <div className="viewerShell">
          <header className="viewerTopbar">
            <a className="minimalLogo" href="/">Moog</a>
            <a className="newShareLink" href="/">New share <span>→</span></a>
          </header>
          <section className="lockStage">
            <div className="lockIcon">SHARE UNAVAILABLE</div>
            <div className="viewerEyebrow">LINK REVOKED</div>
            <h1>This share is no longer available.</h1>
            <p>The creator revoked this link, or its expiry time has passed.</p>
            <div className="lockNote">Temporary sharing · No account required</div>
          </section>
        </div>
      </main>
    );
  }

  return disappearing ? <div className="disappearInk">{children}</div> : children;
}
