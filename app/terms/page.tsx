export const metadata = {
  title: "Terms — Moog",
  description: "Moog terms of use.",
};

export default function TermsPage() {
  return (
    <main className="legalPage">
      <article className="legalShell">
        <a className="minimalLogo brandLogo" href="/" aria-label="Moog home"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none"><path d="M25 20.5 22 23.5a7 7 0 0 0 9.9 9.9l4.4-4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M39 27.5 42 24.5a7 7 0 0 0-9.9-9.9l-4.4 4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="m26 29 12-12" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/></svg><span>moog</span></a>
        <p className="eyebrow">TERMS</p>
        <h1>Use Moog responsibly.</h1>
        <p>Do not use Moog to distribute unlawful content, malware, abuse, or material you do not have the right to share.</p>
        <h2>Temporary means temporary</h2>
        <p>Expiry can make a share unavailable at any time. Keep a copy of anything you need before expiry.</p>
        <h2>No guarantee against copies</h2>
        <p>Moog provides temporary access controls; it cannot guarantee that recipients will not copy, download, photograph, or otherwise retain shared content.</p>
        <h2>Abuse reports</h2>
        <p>We may review reports concerning unlawful content, abuse, malware, copyright, or privacy. Submit a report when a share needs review.</p>
        <a className="primary legalButton" href="/">Back to Moog <span>→</span></a>
      </article>
    </main>
  );
}
