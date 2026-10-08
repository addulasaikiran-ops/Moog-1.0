export const metadata = {
  title: "About — Moog",
  description: "About Moog, temporary access-controlled sharing.",
};

export default function AboutPage() {
  return (
    <main className="legalPage">
      <div className="legalShell">
        <a className="minimalLogo" href="/">moog</a>
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
