export default function NotFound() {
  return (
    <main className="viewerPage viewerMinimal viewerUnavailable">
      <div className="viewerShell">
        <header className="viewerTopbar">
          <a className="minimalLogo brandLogo" href="/" aria-label="Moog home"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none"><path d="M25 20.5 22 23.5a7 7 0 0 0 9.9 9.9l4.4-4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M39 27.5 42 24.5a7 7 0 0 0-9.9-9.9l-4.4 4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="m26 29 12-12" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/></svg><span>moog</span></a>
          <span className="viewerSecure">temporary sharing</span>
        </header>
        <section className="lockStage">
          <div className="lockIcon" aria-hidden="true">?</div>
          <div className="viewerEyebrow">PAGE NOT FOUND</div>
          <h1>This page could not be found.</h1>
          <p>The link may be incorrect, or the page may have moved. Shared content is never shown from an unknown URL.</p>
          <a className="minimalRevealButton" href="/">Back to Moog <span>→</span></a>
        </section>
        <footer className="minimalFooter">moog · temporary sharing</footer>
      </div>
    </main>
  );
}
