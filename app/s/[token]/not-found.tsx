import { ArrowUpRight, LockKeyhole } from "lucide-react";

export default function ShareNotFound() {
  return (
    <main className="viewerPage viewerMinimal viewerUnavailable">
      <div className="viewerShell">
        <header className="viewerTopbar">
          <a className="minimalLogo" href="/">Moog</a>
          <span className="viewerSecure"><LockKeyhole size={15} strokeWidth={1.5} aria-hidden="true" /> temporary share</span>
        </header>
        <section className="lockStage">
          <div className="lockIcon" aria-hidden="true"><LockKeyhole size={22} strokeWidth={1.5} /></div>
          <div className="viewerEyebrow">SHARE UNAVAILABLE</div>
          <h1>This share is no longer available.</h1>
          <p>It may have expired or already been viewed once. Nothing else is required.</p>
          <a className="minimalRevealButton" href="/">Create a new share <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></a>
        </section>
        <footer className="minimalFooter">moog · temporary sharing</footer>
      </div>
    </main>
  );
}
