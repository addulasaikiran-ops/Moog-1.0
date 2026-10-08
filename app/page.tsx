"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const EXPIRY_OPTIONS = [
  { value: 1, label: "1 minute" },
  { value: 5, label: "5 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 360, label: "6 hours" },
  { value: 1440, label: "24 hours" },
  { value: 4320, label: "3 days" },
  { value: 10080, label: "7 days" },
];

const CODE_LANGUAGES = [
  ["javascript", "JavaScript"],
  ["typescript", "TypeScript"],
  ["python", "Python"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["json", "JSON"],
  ["sql", "SQL"],
  ["bash", "Bash"],
  ["java", "Java"],
  ["csharp", "C#"],
  ["cpp", "C++"],
  ["go", "Go"],
  ["rust", "Rust"],
  ["php", "PHP"],
  ["markdown", "Markdown"],
] as const;

type Tab = "send" | "receive";
type Mode = "text" | "code" | "photo";
type RecentShare = { type: Mode; createdAt: string; expiresAt: string; revokeUrl: string };

function formatReceiveCode(value: string): string {
  const raw = value.toUpperCase().replace(/[\s-]/g, "").slice(0, 10);
  if (!raw.startsWith("MG") && raw.length) return raw;
  const body = raw.slice(2, 10);
  if (!body) return "MG";
  return `MG-${body.slice(0, 4)}${body.length > 4 ? `-${body.slice(4, 8)}` : ""}`;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function isValidCode(value: string): boolean {
  return /^MG-[A-HJ-MNP-Z2-9]{4}-[A-HJ-MNP-Z2-9]{4}$/.test(value);
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("send");
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [expiryMinutes, setExpiryMinutes] = useState(60);
  const [accessKey, setAccessKey] = useState("");
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [viewOnce, setViewOnce] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [url, setUrl] = useState("");
  const [revokeUrl, setRevokeUrl] = useState("");
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [copied, setCopied] = useState<"link" | "code" | "">("");
  const [loading, setLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [viewed, setViewed] = useState(false);
  const [error, setError] = useState("");
  const [receiveCode, setReceiveCode] = useState("");
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveError, setReceiveError] = useState("");
  const [recentShares, setRecentShares] = useState<RecentShare[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem("moog_recent_shares") ?? "[]") as unknown;
      if (Array.isArray(stored)) {
        const now = Date.now();
        const valid = stored.filter((entry): entry is RecentShare => {
          if (!entry || typeof entry !== "object") return false;
          const item = entry as Partial<RecentShare>;
          return (
    <main className="page refPage">
      <div className="refShell">
        <header className="refHeader">
          <a className="refBrand" href="/" aria-label="Moog home"><span className="refLogo" aria-hidden="true">⌁</span><span>Moog</span></a>
          <nav className="refNav" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a><a href="#about-moog">About</a><a href="#security">Security</a><a href="#faq">FAQ</a><a className="refNavCta" href="#composer">Create link</a>
          </nav>
        </header>

        <section className="refHeroGrid">
          <div className="refHeroCopy">
            <span className="refBadge">PRIVATE · TEMPORARY · NO ACCOUNT</span>
            <h1>Share privately.<br /><em>Let it disappear.</em></h1>
            <p>Share text, code or images with a private link. Set an expiry and, if you like, add an access key. Nobody has to sign up.</p>
            <div className="refHeroFacts"><div><span>✓</span><b>No account required</b></div><div><span>◷</span><b>Automatic expiry</b></div><div><span>⌁</span><b>Private by default</b></div></div>
            <div className="refStatus"><i /> Link expires automatically</div>
          </div>

          <section className="refComposer" id="composer" aria-labelledby="composer-title">
            <div className="refComposerTabs" role="tablist" aria-label="Send or receive">
              <button type="button" role="tab" aria-selected={tab === "send"} className={tab === "send" ? "active" : ""} onClick={() => changeTab("send")}>Send</button>
              <button type="button" role="tab" aria-selected={tab === "receive"} className={tab === "receive" ? "active" : ""} onClick={() => changeTab("receive")}>Receive</button>
            </div>

            {tab === "send" ? (
              <form onSubmit={handleSubmit}>
                <h2 id="composer-title">Send a share</h2>
                <div className="refKinds" role="group" aria-label="Content type">
                  <button type="button" aria-pressed={mode === "text"} className={mode === "text" ? "active" : ""} onClick={() => setMode("text")}>Text</button>
                  <button type="button" aria-pressed={mode === "code"} className={mode === "code" ? "active" : ""} onClick={() => setMode("code")}>Code</button>
                  <button type="button" aria-pressed={mode === "photo"} className={mode === "photo" ? "active" : ""} onClick={() => { setMode("photo"); setText(""); }}>Image</button>
                </div>

                {mode === "code" ? (
                  <div className="refField"><label htmlFor="language">Language</label><select id="language" value={language} onChange={(event) => setLanguage(event.target.value)}>{CODE_LANGUAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                ) : null}

                {mode !== "photo" ? (
                  <div className="refField">
                    <label htmlFor="share-body">{mode === "code" ? "Your code" : "Your text"}</label>
                    <textarea id="share-body" value={text} onChange={(event) => { setText(event.target.value); setError(""); setUrl(""); }} placeholder={mode === "code" ? "Paste your code…" : "Type or paste what you want to share…"} maxLength={100000} />
                    <div className="refMeta"><span>Up to 100,000 characters</span><span>{text.length.toLocaleString()} / 100,000</span></div>
                  </div>
                ) : (
                  <div className="refField">
                    <label>Your image</label>
                    <div className={dragActive ? "refDrop active" : "refDrop"} onDragOver={(event) => { event.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={onDrop} onClick={() => fileInputRef.current?.click()}>
                      {previewUrl ? <img src={previewUrl} alt="Selected image preview" /> : <><strong>Choose an image</strong><span>Drop, paste or click here</span><small>JPG, PNG, GIF or WebP · up to 10 MB</small></>}
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => { event.stopPropagation(); handleFile(event.target.files?.[0] ?? null); }} />
                    </div>
                  </div>
                )}

                <div className="refField">
                  <label>Link expires in</label>
                  <div className="refPills" role="group" aria-label="Link expiry">
                    {EXPIRY_OPTIONS.map((option) => <button key={option.value} type="button" aria-pressed={expiryMinutes === option.value} className={expiryMinutes === option.value ? "active" : ""} onClick={() => setExpiryMinutes(option.value)}>{option.label.replace(" minutes", " min").replace(" minute", " min").replace(" hours", " hr").replace(" hour", " hr")}</button>)}
                  </div>
                </div>

                <details className="refSecurity" open={showSecurity} onToggle={(event) => setShowSecurity((event.currentTarget as HTMLDetailsElement).open)}>
                  <summary>Security <span>⌄</span></summary>
                  <div className="refSecurityBody">
                    <label className="refField"><span>Access key <small>optional</small></span><div className="refSecret"><input type={showAccessKey ? "text" : "password"} value={accessKey} onChange={(event) => setAccessKey(event.target.value)} maxLength={128} placeholder="Ask recipients for a key" autoComplete="new-password" /><button type="button" onClick={() => setShowAccessKey((value) => !value)}>{showAccessKey ? "Hide" : "Show"}</button></div><small className="refHint">Recipients must enter this key before they can open the share.</small></label>
                    <label className="refCheck"><input type="checkbox" checked={viewOnce} onChange={(event) => setViewOnce(event.target.checked)} /><span><b>View once</b><small>The share is gone after it is revealed one time.</small></span></label>
                  </div>
                </details>

                {error ? <div className="refError" role="alert">{error}</div> : null}
                <button className="refCreate" type="submit" disabled={loading}>{loading ? <><span className="refSpinner" /> Creating…</> : <>Create private link <span>→</span></>}</button>
                <p className="refFine">Links expire automatically. You also get a separate link to revoke early.</p>
              </form>
            ) : (
              <form onSubmit={receiveShare}>
                <h2 id="composer-title">Receive a share</h2>
                <p className="refReceiveIntro">Have a Moog code? Enter it below to open the shared content. No account needed.</p>
                <div className="refField"><label htmlFor="receive-code">Share code</label><input id="receive-code" value={receiveCode} onChange={(event) => { setReceiveCode(formatReceiveCode(event.target.value)); setReceiveError(""); }} placeholder="MG-7K4Q-92XF" autoComplete="off" spellCheck={false} /><small className="refHint">You can also open the private link directly.</small></div>
                {receiveError ? <div className="refError" role="alert">{receiveError}</div> : null}
                <button className="refCreate" type="submit" disabled={!receiveCode || receiveLoading}>{receiveLoading ? <><span className="refSpinner" /> Opening…</> : <>Open share <span>→</span></>}</button>
                <p className="refFine">Expired or revoked shares cannot be opened.</p>
              </form>
            )}
          </section>
        </section>

        {url ? (
          <section className="refResult" aria-live="polite">
            <div className="refResultIcon">✓</div><div className="refResultBody"><b>YOUR PRIVATE LINK IS READY</b>
              <div className="refResultRow"><a href={url} target="_blank" rel="noreferrer">{url}</a><button type="button" onClick={() => void copyValue(url, "link")}>{copied === "link" ? "Copied ✓" : "Copy link"}</button></div>
              <div className="refResultRow"><span>Unique code · <strong>{code}</strong></span><button type="button" onClick={() => void copyValue(code, "code")}>{copied === "code" ? "Copied ✓" : "Copy code"}</button></div>
              <div className="refRevoke"><span>Creator revoke link</span><button type="button" onClick={() => void copyValue(revokeUrl, "revoke")}>{copied === "link" ? "Copied ✓" : "Copy"}</button></div>
              <div className="refResultBottom"><span>Expires in {remaining > 0 ? formatCountdown(remaining) : "0s"}{viewOnce ? (viewed ? " · viewed" : " · not viewed yet") : ""}{accessKey ? " · protected" : ""}</span><button type="button" onClick={() => void revokeShare()} disabled={revokeLoading || revoked || remaining <= 0}>{revoked ? "Revoked ✓" : revokeLoading ? "Revoking…" : "Revoke now"}</button></div>
            </div>
          </section>
        ) : null}

        {tab === "send" && recentShares.length ? (
          <section className="refRecent"><div><b>RECENT SHARES ON THIS DEVICE</b><p>Saved only on this device. Clearing browser data removes it.</p></div>
            {recentShares.map((item) => <div className="refRecentItem" key={item.revokeUrl}><span><strong>{item.type === "photo" ? "Photo" : item.type === "code" ? "Code" : "Text"}</strong><small>{new Date(item.expiresAt).getTime() <= Date.now() ? "Expired" : "Active · " + formatCountdown(new Date(item.expiresAt).getTime() - Date.now()) + " left"}</small></span><span><button type="button" onClick={() => void copyValue(item.revokeUrl, "revoke")}>Copy revoke link</button>{new Date(item.expiresAt).getTime() > Date.now() ? <button className="danger" type="button" onClick={() => void revokeShare(item.revokeUrl)}>Revoke</button> : null}<button className="plain" type="button" onClick={() => removeRecentShare(item.revokeUrl)}>Remove</button></span></div>)}
          </section>
        ) : null}

        <section className="refFeatureGrid" aria-label="Moog benefits">
          <article><span>01</span><h3>Private by default</h3><p>Your content is not publicly searchable. Access requires the share link.</p></article>
          <article><span>02</span><h3>Automatic expiry</h3><p>Choose from 1 minute to 7 days and let the link disappear on its own.</p></article>
          <article><span>03</span><h3>Revoke anytime</h3><p>Keep a separate creator link and stop access before expiry.</p></article>
          <article><span>04</span><h3>No account required</h3><p>Send and receive without sign-up, profiles or account passwords.</p></article>
        </section>

        <section className="refSection" id="how-it-works">
          <div className="refSectionHead"><span>HOW IT WORKS</span><h2>A simple 4-step process.</h2><p>Share. Control. Done.</p></div>
          <div className="refSteps"><article><b>01</b><h3>Create</h3><p>Add text, code or an image and choose how long the link lasts.</p></article><i>→</i><article><b>02</b><h3>Share</h3><p>Send the link and keep the separate revoke link for yourself.</p></article><i>→</i><article><b>03</b><h3>Open</h3><p>Recipients open it without an account, with a key if needed.</p></article><i>→</i><article><b>04</b><h3>Expire</h3><p>Access ends when the timer expires, you revoke it or it is viewed once.</p></article></div>
        </section>

        <section className="refSection" id="about-moog">
          <div className="refSectionHead"><span>USE MOOG FOR</span><h2>Simple, secure and temporary sharing.</h2><p>Built for situations where access should not last forever.</p></div>
          <div className="refUseGrid"><article><b>⌁</b><div><h3>Sensitive information</h3><p>Share details that should not remain in a chat history forever.</p></div></article><article><b>&lt;/&gt;</b><div><h3>Code snippets</h3><p>Send code with a language label and a defined lifetime.</p></div></article><article><b>▤</b><div><h3>Temporary notes</h3><p>Move a note between devices without creating an account.</p></div></article><article><b>▧</b><div><h3>Private images</h3><p>Share JPG, PNG, GIF or WebP images up to 10 MB.</p></div></article></div>
        </section>

        <section className="refSection" id="security">
          <div className="refSectionHead"><span>SECURITY & PRIVACY</span><h2>Built with privacy in mind.</h2><p>Here’s what you need to know.</p></div>
          <div className="refSecurityGrid"><article><b>⌁</b><h3>Private links</h3><p>High-entropy links make casual guessing impractical.</p></article><article><b>▤</b><h3>Secure storage</h3><p>Share and creator tokens are stored as hashes.</p></article><article><b>✓</b><h3>Access, not copies</h3><p>Once someone can see content, they can still copy or screenshot it.</p></article><article><b>◉</b><h3>No tracking</h3><p>No account profiles and no third-party analytics tracking.</p></article></div>
          <p className="refDisclosure">Moog stores active shared content on the server so it can deliver the share. It is access-controlled temporary sharing, not end-to-end encryption.</p>
        </section>

        <section className="refFaqArea" id="faq">
          <div><div className="refSectionHead left"><span>FAQ</span><h2>Questions, answered.</h2></div>
            <div className="refFaq">{[
              ["Is my share end-to-end encrypted?", "Not yet. Moog currently protects access to server-stored content, but the server can technically read active share content. Treat it as temporary access control, not zero-knowledge encryption."],
              ["Do I need an account?", "No. Sending and receiving are both account-free."],
              ["How long do shares stay alive?", "Choose from 1 minute to 7 days when you create a share."],
              ["Can I revoke a share early?", "Yes. Keep the creator control link shown after creation and use it while the share is active."],
              ["Can someone copy what I shared?", "Yes. Moog controls access, not copies. Screenshots and copied content cannot be taken back."],
              ["What can I share?", "Text, supported code formats, and JPG, PNG, GIF or WebP photos up to 10 MB."],
            ].map(([question, answer], index) => <details key={question} open={openFaq === index}><summary onClick={(event) => { event.preventDefault(); setOpenFaq(openFaq === index ? null : index); }}>{question}<span>⌄</span></summary>{openFaq === index ? <p>{answer}</p> : null}</details>)}</div>
          </div>
          <aside className="refContact"><span>✉</span><h3>Still have questions?</h3><p>We’re here to help. If you need more information, reach out.</p><a href="/contact">Contact us →</a></aside>
        </section>

        <footer className="refFooter"><div><strong>Moog</strong><span>Moog controls access, not copies.</span></div><nav aria-label="Footer"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a><a href="/report-abuse">Report abuse</a></nav><small>© 2026 Moog</small></footer>
      </div>
    </main>
  );

}
