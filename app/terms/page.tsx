export const metadata = {
  title: "Terms — Moog 1.0",
  description: "Moog 1.0 terms of use.",
};

export default function TermsPage() {
  return (
    <main className="legalPage">
      <article className="legalShell">
        <a className="minimalLogo" href="/">moog</a>
        <p className="eyebrow">TERMS</p>
        <h1>Use Moog responsibly.</h1>
        <p>Do not use Moog to distribute unlawful content, malware, abuse, or material you do not have the right to share.</p>
        <h2>Temporary means temporary</h2>
        <p>Expiry and revocation can make a share unavailable at any time. Keep a copy of anything you need before its expiry.</p>
        <h2>No guarantee against copies</h2>
        <p>Moog provides temporary access controls; it cannot guarantee that recipients will not copy, download, photograph, or otherwise retain shared content.</p>
        <a className="primary legalButton" href="/">Back to Moog <span>→</span></a>
      </article>
    </main>
  );
}
