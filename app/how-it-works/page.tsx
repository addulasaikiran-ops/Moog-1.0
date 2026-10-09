export default function HowItWorksPage() {
  const steps = [
    ["01", "Add your content", "Paste text, choose a code language, or upload a supported photo."],
    ["02", "Set access rules", "Choose an expiry time and optionally enable password protection or view-once access."],
    ["03", "Share the link or code", "Send the private link or six-digit receive code to the intended recipient."],
  ];
  const faqs = [
    ["How long do shares last?", "Choose from one minute to seven days when creating a share."],
    ["Can I protect a share with a password?", "Yes. Enable password protection in Security settings and give the password to the recipient separately."],
    ["What happens after view-once content is opened?", "A view-once share is designed to become unavailable after its first successful reveal."],
    ["Can I revoke a share early?", "Yes. Use the revoke action shown after creating the share. Revocation prevents future access through that share."],
    ["Do I need an account?", "No account is required for the core create and receive flows."],
  ];
  return <main className="recentPage">
    <div className="recentShell">
      <header className="recentTopbar"><a className="recentLogo" href="/" aria-label="Moog home"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none"><path d="M25 20.5 22 23.5a7 7 0 0 0 9.9 9.9l4.4-4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M39 27.5 42 24.5a7 7 0 0 0-9.9-9.9l-4.4 4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="m26 29 12-12" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Moog</span></a><a href="/#composer">Create share →</a></header>
      <section className="recentIntro"><p className="recentEyebrow">THREE SIMPLE STEPS</p><h1>How it works</h1><p>Temporary sharing should feel simple. Add content, choose the access rules, then send the link or code.</p></section>
      <section className="howGuideSteps">{steps.map(([number,title,description]) => <article className="howGuideStep" key={number}><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></article>)}</section>
      <section className="howGuideFaq"><p className="recentEyebrow">NEED TO KNOW</p><h2>Frequently asked questions</h2>{faqs.map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
      <section className="howGuideCta"><h2>Ready to share something?</h2><p>No account. Clear expiry. Access you can revoke.</p><a href="/#composer">Create a secure share →</a></section>
    </div>
  </main>;
}
