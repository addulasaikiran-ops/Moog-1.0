export default function ShareLoading() {
  return (
    <main className="viewerPage shareStatusPage" aria-busy="true" aria-live="polite">
      <div className="viewerShell">
        <header className="viewerTopbar"><a className="minimalLogo brandLogo" href="/" aria-label="Moog home"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none"><path d="M25 20.5 22 23.5a7 7 0 0 0 9.9 9.9l4.4-4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M39 27.5 42 24.5a7 7 0 0 0-9.9-9.9l-4.4 4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="m26 29 12-12" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/></svg><span>moog</span></a><span className="viewerSecure">opening share</span></header>
        <section className="shareStatusCard minimalCard">
          <div className="statusSkeleton" aria-hidden="true"><span /><span /><span /></div>
          <div className="viewerEyebrow">SECURE SHARE</div>
          <h1>Opening your share…</h1>
          <p>Checking the link and preparing the content.</p>
        </section>
      </div>
    </main>
  );
}
