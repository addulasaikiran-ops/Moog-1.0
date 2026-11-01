export default function NotFound() {
  return (
    <main className="legalPage moogErrorPage">
      <section className="legalShell" aria-labelledby="not-found-title">
        <a className="minimalLogo" href="/" aria-label="Moog home">moog</a>
        <p className="eyebrow">404 · NOT FOUND</p>
        <h1 id="not-found-title">This share is no longer available.</h1>
        <p>The link may have expired, been revoked, or never existed. Moog controls access, not copies.</p>
        <a className="primary legalButton" href="/">Return to Moog <span aria-hidden="true">→</span></a>
      </section>
    </main>
  );
}
