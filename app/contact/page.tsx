export const metadata = { title: "Contact — Moog", description: "Contact and support information for Moog." };

export default function ContactPage() {
  return <main className="legalPage"><article className="legalShell">
    <a className="minimalLogo" href="/">moog</a><p className="eyebrow">CONTACT</p>
    <h1>Need to reach Moog?</h1>
    <p>For abuse reports, unlawful-content notices, or service issues, use the dedicated report form. It records the report for review without requiring an account.</p>
    <div className="legalCallout"><strong>Report abuse or illegal content</strong><p>Include the share URL, what is wrong, and enough detail for us to locate the material.</p><a className="primary legalButton" href="/report-abuse">Open report form <span>→</span></a></div>
    <p>For privacy requests, describe the request in the report form and select the privacy-related category.</p>
    <a className="minimalNewShare" href="/">Back to Moog <span>→</span></a>
  </article></main>;
}
