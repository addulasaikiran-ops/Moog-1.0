"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep error details out of the UI; the framework handles server-side reporting.
    void error.digest;
  }, [error]);

  return (
    <main className="legalPage moogErrorPage">
      <section className="legalShell" aria-labelledby="error-title">
        <a className="minimalLogo" href="/" aria-label="Moog home">moog</a>
        <p className="eyebrow">SOMETHING WENT WRONG</p>
        <h1 id="error-title">That didn’t go as planned.</h1>
        <p>Nothing you need to do here. Try again, or return to Moog and start over.</p>
        <div className="moogErrorActions">
          <button className="primary legalButton" type="button" onClick={reset}>Try again</button>
          <a className="minimalNewShare" href="/">Back to Moog <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </main>
  );
}
