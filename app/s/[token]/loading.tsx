export default function ShareLoading() {
  return (
    <main className="viewerPage shareStatusPage" aria-busy="true" aria-live="polite">
      <div className="viewerShell">
        <header className="viewerTopbar"><a className="minimalLogo" href="/">Moog</a><span className="viewerSecure">opening share</span></header>
        <section className="shareStatusCard minimalCard">
          <div className="statusSpinner" aria-hidden="true" />
          <div className="viewerEyebrow">SECURE SHARE</div>
          <h1>Opening your share…</h1>
          <p>Checking the link and preparing the content.</p>
        </section>
      </div>
    </main>
  );
}
