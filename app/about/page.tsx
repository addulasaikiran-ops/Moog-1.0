export const metadata = {
  title: "About — Moog",
  description: "About Moog, temporary access-controlled sharing.",
};

export default function AboutPage() {
  return (
    <main className="legalPage">
      <div className="legalShell">
        <a className="minimalLogo brandLogo" href="/" aria-label="Moog home"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none"><path d="M25 20.5 22 23.5a7 7 0 0 0 9.9 9.9l4.4-4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M39 27.5 42 24.5a7 7 0 0 0-9.9-9.9l-4.4 4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="m26 29 12-12" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/></svg><span>moog</span></a>
        <p className="eyebrow">ABOUT MOOG</p>
        <h1>Temporary access, no account required.</h1>
        <p>Moog lets you share text, code, and photos through access-controlled links that expire. Sending and receiving are account-free.</p>
        <h2>What Moog protects</h2>
        <p>Links use high-entropy identifiers, access keys are hashed, shares expire server-side. Moog controls access, not copies.</p>
        <h2>What Moog does not provide yet</h2>
        <p>Moog is not end-to-end encrypted. The service stores active share content on the server so it can deliver it. Do not treat Moog as a zero-knowledge vault.</p>
        <a className="primary legalButton" href="/">Back to Moog <span>→</span></a>
      </div>
    </main>
  );
}
