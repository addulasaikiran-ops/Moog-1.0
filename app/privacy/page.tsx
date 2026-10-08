export const metadata = {
  title: "Privacy — Moog",
  description: "Moog privacy information.",
};

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <article className="legalShell">
        <a className="minimalLogo" href="/">moog</a>
        <p className="eyebrow">PRIVACY</p>
        <h1>Privacy, without pretending.</h1>
        <p>Moog stores active share content on the server because the service must retrieve it for recipients. This is access-controlled temporary sharing, not end-to-end encryption.</p>
        <h2>Temporary data</h2>
        <p>Shares have a server-enforced expiry and are deleted by the expiry cleanup process. Optional access keys are stored as bcrypt hashes for new shares; legacy scrypt hashes remain supported for existing shares. Public share tokens and receive codes are stored only as hashes.</p>
        <h2>Photos</h2>
        <p>Uploads are restricted to JPG, PNG, GIF, and WebP, checked against their real file signatures, reprocessed server-side, and limited to 10 MB. Reprocessing removes image metadata such as EXIF where the image processor supports it.</p>
        <h2>Copies and previews</h2>
        <p>Anyone who can open a share may copy or screenshot what they see. View-once shares require an explicit reveal action before the content is consumed.</p>
        <h2>Rate limiting and logs</h2>
        <p>Moog does not store raw IP addresses or user-agent values in its application data. For abuse prevention and rate limiting, it uses a short-lived HMAC-derived client key; rate-limit records are automatically deleted after 26 hours.</p>
        <h2>Abuse reports</h2>
        <p>Use the report-abuse form for illegal content, harassment, malware, copyright concerns, or privacy requests. Reports are rate-limited and stored for review.</p>
        <a className="primary legalButton" href="/">Back to Moog <span>→</span></a>
      </article>
    </main>
  );
}
