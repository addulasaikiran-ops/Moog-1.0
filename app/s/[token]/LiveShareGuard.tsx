"use client";

import { ReactNode, useEffect, useState } from "react";

export default function LiveShareGuard({
  token,
  children,
}: {
  token: string;
  children: ReactNode;
}) {
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        const response = await fetch(`/api/shares/${token}/status`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok && active) setAvailable(false);
      } catch {
        // Keep the current view on transient network errors; the next poll retries.
      }
    };

    const interval = window.setInterval(check, 2000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [token]);

  if (!available) {
    return (
      <main className="viewerPage viewerMinimal viewerLockedPage">
        <div className="viewerShell">
          <header className="viewerTopbar">
            <a className="minimalLogo" href="/">moog</a>
            <a className="newShareLink" href="/">New share <span>→</span></a>
          </header>
          <section className="lockStage">
            <div className="lockIcon">SHARE UNAVAILABLE</div>
            <div className="viewerEyebrow">LINK REVOKED</div>
            <h1>This share is no longer available.</h1>
            <p>The creator revoked this link, or its expiry time has passed.</p>
            <div className="lockNote">Private, temporary sharing · No account required</div>
          </section>
        </div>
      </main>
    );
  }

  return children;
}
