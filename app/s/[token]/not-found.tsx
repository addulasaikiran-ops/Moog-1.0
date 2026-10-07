export default function ShareNotFound() {
  return (
    <main className="viewerPage viewerMinimal viewerUnavailable">
      <div className="viewerShell">
        <header className="viewerTopbar">
          <a className="minimalLogo" href="/">moog</a>
          <span className="viewerSecure"><span className="lockDot">⌁</span> temporary share</span>
        </header>
        <section className="lockStage">
          <div className="lockIcon" aria-hidden="true">⌑</div>
          <div className="viewerEyebrow">SHARE UNAVAILABLE</div>
          <h1>This share is no longer available.</h1>
          <p>It may have expired, been revoked, or already been viewed once. Nothing else is required.</p>
          <a className="minimalRevealButton" href="/">Create a new share <span>→</span></a>
        </section>
        <footer className="minimalFooter">moog · private, temporary sharing</footer>
      </div>
    </main>
  );
}
