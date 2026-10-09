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
type RecentShare = { type: Mode; createdAt: string; expiresAt: string; url: string; code: string; passwordProtected: boolean; viewOnce: boolean; revoked?: boolean };

function formatReceiveCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
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
  return /^\d{6}$/.test(value);
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("send");
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [expiryMinutes, setExpiryMinutes] = useState(1440);
  const [accessKey, setAccessKey] = useState("");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [viewOnce, setViewOnce] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [revokeToken, setRevokeToken] = useState("");
  const [revoked, setRevoked] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revokeError, setRevokeError] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [copied, setCopied] = useState<"link" | "code" | "">("");
  const [loading, setLoading] = useState(false);
  const [viewed, setViewed] = useState(false);
  const [error, setError] = useState("");
  const [receiveCode, setReceiveCode] = useState("");
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveError, setReceiveError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const receiveInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function changeTab(next: Tab) {
    setTab(next);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", next);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    setError("");
    setReceiveError("");
  }

  function handleFile(nextFile: File | null) {
    if (!nextFile) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(nextFile.type)) {
      setError("Use JPG, PNG, GIF, or WebP.");
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError("Image must be 10 MB or smaller.");
      return;
    }
    setFile(nextFile);
    setError("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    handleFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function copyValue(value: string, kind: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      setError("Could not copy. Please copy it manually.");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setUrl("");
    setCode("");
    setRevokeToken("");
    setRevoked(false);
    setRevokeError("");
    setExpiresAt("");
    setRemaining(0);
    setViewed(false);

    if (mode === "photo" && !file) {
      setError("Choose an image first.");
      return;
    }
    if (mode !== "photo" && !text.trim()) {
      setError("Please enter some text before creating a share.");
      return;
    }

    setLoading(true);
    try {
      let response: Response;
      if (mode === "photo") {
        const body = new FormData();
        body.set("file", file as File);
        body.set("text", text);
        body.set("password", accessKey);
        body.set("viewOnce", String(viewOnce));
        body.set("expiryMinutes", String(expiryMinutes));
        response = await fetch("/api/shares", { method: "POST", body });
      } else {
        response = await fetch("/api/shares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            language: mode === "code" ? language : "text",
            password: passwordEnabled ? accessKey : "",
            viewOnce,
            expiryMinutes,
          }),
        });
      }

      const body = (await response.json()) as { url?: string; code?: string; revokeToken?: string; expiresAt?: string; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not create link.");
      setUrl(body.url ?? "");
      setCode(body.code ?? "");
      setRevokeToken(body.revokeToken ?? "");
      setRevoked(false);
      setExpiresAt(body.expiresAt ?? "");
      if (body.url && body.code && body.expiresAt) {
        try {
          const key = "moog-recent-shares-v1";
          const previous = JSON.parse(window.localStorage.getItem(key) ?? "[]") as RecentShare[];
          const entry: RecentShare = { type: mode, createdAt: new Date().toISOString(), expiresAt: body.expiresAt, url: body.url, code: body.code, passwordProtected: Boolean(accessKey), viewOnce };
          window.localStorage.setItem(key, JSON.stringify([entry, ...previous.filter((item) => item.url !== entry.url)].slice(0, 30)));
        } catch { /* Local history is optional and must never block share creation. */ }
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create link.");
    } finally {
      setLoading(false);
    }
  }

  async function revokeShare() {
    if (!url || !revokeToken || revoked) return;
    if (!window.confirm("Revoke this share now? Anyone using its link or code will lose access.")) return;
    const token = new URL(url).pathname.split("/").filter(Boolean).pop();
    if (!token) { setRevokeError("Could not identify this share."); return; }
    setRevokeLoading(true);
    setRevokeError("");
    try {
      const response = await fetch(`/api/shares/${token}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeToken }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not revoke this share.");
      setRevoked(true);
      setCode("");
      setRevokeToken("");
    } catch (error) {
      setRevokeError(error instanceof Error ? error.message : "Could not revoke this share.");
    } finally {
      setRevokeLoading(false);
    }
  }

  async function receiveShare(event: FormEvent) {
    event.preventDefault();
    setReceiveError("");
    const normalized = formatReceiveCode(receiveCode);
    if (!isValidCode(normalized)) {
      setReceiveError("Enter the 6-digit share code.");
      return;
    }

    setReceiveLoading(true);
    try {
      const response = await fetch("/api/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      const body = (await response.json()) as { token?: string; error?: string; reason?: string };
      if (!response.ok || !body.token) {
        const message =
          body.reason === "expired"
            ? "This share has expired"
            : response.status === 429
                ? "Too many attempts. Try again in a few minutes."
                : "That code didn't work";
        throw new Error(message);
      }
      window.location.assign(`/s/${body.token}`);
    } catch (receiveSubmitError) {
      setReceiveError(receiveSubmitError instanceof Error ? receiveSubmitError.message : "Share unavailable.");
    } finally {
      setReceiveLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />

      <div className="shell">
        <header className="topbar">
          <a className="logo" href="/" aria-label="Moog home"><span className="logoLock" aria-hidden="true">∞</span><span>Moog</span></a>
          <nav className="topNav" aria-label="Primary"><a href="#how-it-works">How it works</a><a href="#security">Security</a><a href="/recent">Recent shares</a><a href="/report-abuse">Report abuse</a><a className="headerCreate" href="#composer">Create share</a></nav>
        </header>

        <section className="hero">
          <div className="eyebrow heroBadge">PRIVATE · TEMPORARY · SIMPLE</div>
          <h1>Share privately.<br /><span>Disappear automatically.</span></h1>
          <p className="heroCopy">Send text, code, or photos with expiry, password protection, and view-once access.</p>
          <div className="heroActions"><a className="heroPrimaryAction" href="#composer">Create a secure share <span aria-hidden="true">→</span></a><button className="heroSecondaryAction" type="button" onClick={() => { changeTab("receive"); window.setTimeout(() => document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }}>I have a code</button></div>
          <div className="heroBenefits" aria-label="Key benefits">
            <div><i className="heroBenefitIcon heroBenefitPurple">●</i><span><strong>No account</strong><small>required</small></span></div>
            <div><i className="heroBenefitIcon heroBenefitBlue">◷</i><span><strong>Automatic</strong><small>expiry</small></span></div>
            <div><i className="heroBenefitIcon heroBenefitGreen">✓</i><span><strong>Private</strong><small>by default</small></span></div>
          </div>
        </section>
        <div className="heroVisual" aria-hidden="true">
          <div className="visualGlow" />
          <div className="visualPanel visualPanelBack"><span></span><span></span><span></span><span></span><span></span></div>
          <div className="visualPanel visualPanelMain">
            <div className="visualCode"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
            <div className="visualPhoto" />
          </div>
          <div className="visualLock">●</div>
          <div className="visualExpiry"><b>◷</b><span>Link expires<br /><strong>in 15 minutes</strong></span></div>
        </div>

        <div className="referenceComposerTabs" role="tablist" aria-label="Send or receive">
          <button type="button" role="tab" aria-selected={tab === "send"} className={tab === "send" ? "referenceComposerTab active" : "referenceComposerTab"} onClick={() => changeTab("send")}>Send</button>
          <button type="button" role="tab" aria-selected={tab === "receive"} className={tab === "receive" ? "referenceComposerTab active" : "referenceComposerTab"} onClick={() => changeTab("receive")}>Receive</button>
        </div>
        {tab === "send" ? (
          <section className="composer card" id="composer" aria-labelledby="send-title">
            <div className="srOnly" id="send-title">Send a share</div>
            <form onSubmit={handleSubmit}>
              <div className="composerTop">
                <div className="srOnly">{mode === "photo" ? "Image" : mode === "code" ? "Code" : "Text"} composer</div>
                {mode === "photo" ? <div className="counter">10 MB max</div> : <div className="counter">{text.length.toLocaleString()} / 100,000</div>}
              </div>

              <div className="modeToggle" role="group" aria-label="Content mode">
                <button type="button" className={mode === "text" ? "modeButton active" : "modeButton"} onClick={() => setMode("text")}>▣ <span>Text</span></button>
                <button type="button" className={mode === "code" ? "modeButton active" : "modeButton"} onClick={() => setMode("code")}>{"</>"} <span>Code</span></button>
                <button type="button" className={mode === "photo" ? "modeButton active" : "modeButton"} onClick={() => { setMode("photo"); setText(""); }}>▧ <span>Photo</span></button>
              </div>

              {mode !== "photo" ? <textarea value={text} onChange={(event) => { setText(event.target.value); setError(""); setUrl(""); }} placeholder={mode === "code" ? "Paste your code snippet…" : "Paste the text you want to share…"} maxLength={100000} aria-label="Text to share" autoFocus /> : null}

              {mode === "code" ? (
                <div className="codeSelectRow">
                  <label htmlFor="language">Language</label>
                  <select id="language" value={language} onChange={(event) => setLanguage(event.target.value)}>
                    {CODE_LANGUAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              ) : null}

              {mode === "photo" ? (
                <div
                  className={dragActive ? "photoComposer dragActive" : "photoComposer"}
                  onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={onDrop}
                  onPaste={(event) => {
                    if (mode !== "photo") return;
                    const image = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
                    if (image) { event.preventDefault(); handleFile(image); }
                  }}
                >
                  {previewUrl ? <img src={previewUrl} alt="Selected preview" /> : <div className="photoDrop"><div className="photoDropIcon" aria-hidden="true">+</div><strong>Drop an image here</strong><span>or choose a photo</span><small>JPG / PNG / GIF / WebP · up to 10 MB</small></div>}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
                  <button className="copy" type="button" onClick={() => fileInputRef.current?.click()}>Choose image</button>
                </div>
              ) : null}

              <div className="lifetimeSection">
                <div className="lifetimeHeader"><span>Link expires in</span><strong>{EXPIRY_OPTIONS.find((option) => option.value === expiryMinutes)?.label ?? "1 hour"}</strong></div>
                <div className={`lifetimePills expiry-${EXPIRY_OPTIONS.findIndex((option) => option.value === expiryMinutes)}`} role="group" aria-label="Link lifetime">
                  <span className="lifetimeActivePill" aria-hidden="true" />
                  {EXPIRY_OPTIONS.map((option) => <button key={option.value} type="button" className={expiryMinutes === option.value ? "lifetimePill active" : "lifetimePill"} onClick={() => setExpiryMinutes(option.value)}>{option.label.replace(" minutes", " min").replace(" minute", " min").replace(" hours", " hr").replace(" hour", " hr")}</button>)}
                </div>
              </div>
              <div className="securityBar">
                <button type="button" className={showSecurity ? "securityDisclosure open" : "securityDisclosure"} aria-expanded={showSecurity} onClick={() => setShowSecurity((value) => !value)}>
                  <span className="securityDot" aria-hidden="true" />
                  <span><strong>Security</strong><small>{passwordEnabled && accessKey ? "Password protection enabled" : viewOnce ? "View once enabled" : "Optional controls"}</small></span>
                  <span className="securityChevron" aria-hidden="true">⌄</span>
                </button>
                {showSecurity ? <div className="securityOptions">
                  <div className="optionField accessKeyField"><label className="passwordToggleRow"><input type="checkbox" checked={passwordEnabled} onChange={(event) => { setPasswordEnabled(event.target.checked); if (!event.target.checked) setAccessKey(""); }} /><span><strong>Password protection</strong><small>Require a password before the share can be opened.</small></span></label>{passwordEnabled ? <><div className="secretInput"><input type={showAccessKey ? "text" : "password"} value={accessKey} onChange={(event) => setAccessKey(event.target.value)} maxLength={128} minLength={1} placeholder="Set a password" aria-describedby="access-key-note" required /><button type="button" className="toggleSecret" aria-label={showAccessKey ? "Hide password" : "Show password"} onClick={() => setShowAccessKey((value) => !value)}>{showAccessKey ? "Hide" : "Show"}</button></div><small id="access-key-note" className="optionNote">Recipient must enter this password to view the share.</small></> : null}</div>
                  <div><label className="checkField"><input type="checkbox" checked={viewOnce} onChange={(event) => setViewOnce(event.target.checked)} /><span><strong>View once</strong><small>Allow only one successful view.</small></span></label>{viewOnce ? <p className="viewOnceWarning" role="status">After the first successful view, this content will no longer be accessible.</p> : null}</div>
                </div> : null}
              </div>

              {error ? <div className="formError" role="alert">{error}</div> : null}

              <button className="primary createButton" type="submit" disabled={loading}>{loading ? <><span className="spinner" /> Creating…</> : <>↗ &nbsp; Create secure share <span>→</span></>}</button>
              <div className="composerTrust">◈ &nbsp; No account required. Your content expires automatically.</div>
            </form>
          </section>
        ) : (
          <section className="receiveCard card" id="composer" aria-labelledby="receive-title">
            <div className="receiveHeader"><span className="receiveGlyph" aria-hidden="true">↓</span><div><h2 id="receive-title">Receive</h2><p>Got a code from someone? Paste it here to open what they shared. No account needed.</p></div></div>
            <form onSubmit={receiveShare}>
              <div className="receiveLabel">Unique code</div>
              <div className="receiveCodeBoxes" role="group" aria-labelledby="receive-code-label" onPaste={(event) => { const pasted = formatReceiveCode(event.clipboardData.getData("text")); if (pasted) { event.preventDefault(); setReceiveCode(pasted); setReceiveError(""); receiveInputRefs.current[Math.min(pasted.length, 5)]?.focus(); } }}><span id="receive-code-label" className="srOnly">Six-digit share code</span>{Array.from({ length: 6 }, (_, index) => <input key={index} ref={(node) => { receiveInputRefs.current[index] = node; }} className="receiveDigit" aria-label={`Share code digit ${index + 1}`} value={receiveCode[index] ?? ""} inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={1} onChange={(event) => { const digit = event.target.value.replace(/\D/g, "").slice(-1); const next = (receiveCode.slice(0, index) + digit + receiveCode.slice(index + 1)).slice(0, 6); setReceiveCode(next); setReceiveError(""); if (digit && index < 5) receiveInputRefs.current[index + 1]?.focus(); }} onKeyDown={(event) => { if (event.key === "Backspace" && !receiveCode[index] && index > 0) receiveInputRefs.current[index - 1]?.focus(); if (event.key === "ArrowLeft" && index > 0) receiveInputRefs.current[index - 1]?.focus(); if (event.key === "ArrowRight" && index < 5) receiveInputRefs.current[index + 1]?.focus(); }} />)}</div>
              <p id="receive-help" className="receiveHint">Six numbers. If the share is protected, you’ll also enter its password.</p>
              {receiveError ? <p className="receiveError" role="alert">{receiveError}</p> : null}
              <button className="receiveOpen primary" type="submit" disabled={!receiveCode || receiveLoading}>{receiveLoading ? <><span className="spinner" /> Opening share…</> : <>Open share <span>→</span></>}</button>
            </form>
            <div className="receiveNote"><span aria-hidden="true">⌁</span><span>Locked shares ask for the access key. View-once shares open through their normal one-time reveal.</span></div>
          </section>
        )}

        {url ? (
          <section className="result resultExpanded" aria-live="polite" aria-labelledby="share-ready-title">
            <div className="resultSuccessRow">
              <div className="resultIcon" aria-hidden="true">✓</div>
              <div><div className="resultLabel">SHARE CREATED</div><h2 id="share-ready-title">Your secure share is ready.</h2><p>Use either the private link or the 6-digit code.</p></div>
            </div>
            <div className="resultBody">
              <div className="resultFieldLabel">PRIVATE LINK</div>
              {!revoked ? <div className="resultLinkRow"><a href={url} target="_blank" rel="noreferrer">{url}</a><button className="copy resultPrimaryCopy" type="button" onClick={() => void copyValue(url, "link")}>{copied === "link" ? "Copied ✓" : "Copy link"}</button></div> : <p className="revokeNotice" role="status">This share has been revoked. Its link and code can no longer be used.</p>}
              {!revoked ? <div className="uniqueCodeBox"><div><span>6-DIGIT SHARE CODE</span><strong>{code}</strong></div><button className="copy codeCopyButton" type="button" onClick={() => void copyValue(code, "code")}>{copied === "code" ? "Copied ✓" : "⧉ Copy"}</button></div> : null}
              <div className="resultMetaGrid" aria-label="Share details"><div><span>EXPIRES</span><strong>{remaining > 0 ? formatCountdown(remaining) : "Expired"}</strong></div><div><span>ACCESS</span><strong>{accessKey ? "Password protected" : "No password"}</strong></div><div><span>VIEWING</span><strong>{viewOnce ? "View once" : "Until expiry"}</strong></div></div>
              <p className="resultNote">{revoked ? "Access has been revoked." : "Keep the link private. Anyone who has it can attempt to open the share."}</p>{revokeError ? <p className="formError" role="alert">{revokeError}</p> : null}
              <div className="resultBottom"><span className="copyFeedback" aria-live="polite">{revoked ? "Share revoked." : copied ? `${copied === "link" ? "Private link" : "Share code"} copied to clipboard.` : "Ready to share."}</span>{!revoked ? <button className="revokeButton" type="button" onClick={() => void revokeShare()} disabled={revokeLoading || !revokeToken}>{revokeLoading ? "Revoking…" : "Revoke link"}</button> : null}<button className="resultNewButton" type="button" onClick={() => { setUrl(""); setCode(""); setRevokeToken(""); setRevoked(false); setRevokeError(""); setExpiresAt(""); setError(""); window.scrollTo({ top: document.getElementById("composer")?.offsetTop ?? 0, behavior: "smooth" }); }}>Create another</button></div>
            </div>
          </section>
        ) : null}


                <section className="productFeatures" aria-label="Moog benefits">
          <div className="featureCard featurePurple"><i>◷</i><strong>Temporary by design</strong><small>Your content expires automatically, based on the lifetime you choose.</small></div>
          <div className="featureCard featureBlue"><i>⌑</i><strong>Protected access</strong><small>Optional password protection and view-once access help control who can open a share.</small></div>
          
          <div className="featureCard featureOrange"><i>◉</i><strong>No account needed</strong><small>Create a share and send it instantly without signing up.</small></div>
        </section>

        <section className="howMoog referenceHow" id="how-it-works" aria-labelledby="how-title">
          <div className="howIntro"><div className="eyebrow">HOW IT WORKS</div><h2 id="how-title">How it works</h2><p>A simple 4-step process. Share. Control. Done.</p></div>
          <div className="howSteps">
            <div><b className="stepPurple">01</b><strong>Create</strong><small>Paste text, code, or an image and choose an expiry time.</small></div>
            <span>→</span>
            <div><b className="stepBlue">02</b><strong>Share</strong><small>Get a private link and send it to anyone.</small></div>
            <span>→</span>
            <div><b className="stepGreen">03</b><strong>Open</strong><small>They open it without an account.</small></div>
            <span>→</span>
            <div><b className="stepOrange">04</b><strong>Expire</strong><small>Access disappears automatically.</small></div>
          </div>
        </section>

        <section className="useMoog" id="about-moog" aria-labelledby="use-title">
          <div className="useIntro"><div className="eyebrow">USE MOOG FOR</div><h2 id="use-title">Simple, secure and temporary sharing.</h2><p>Built for real situations where access should not last forever.</p></div>
          <div className="useGrid">
            <div><i className="usePink">▣</i><strong>Sensitive information</strong><small>Share passwords, API keys or other secrets.</small></div>
            <div><i className="useBlue">&lt;/&gt;</i><strong>Code snippets</strong><small>Send code to a teammate without leaving it forever.</small></div>
            <div><i className="useGreen">▤</i><strong>Temporary notes</strong><small>Share text between devices without an account.</small></div>
            <div><i className="useOrange">▧</i><strong>Private images</strong><small>Share screenshots or photos that shouldn&apos;t stay online.</small></div>
          </div>
        </section>

        <section className="securityReference" id="security" aria-labelledby="security-title">
          <div className="sectionHeading"><div className="eyebrow">SECURITY & PRIVACY</div><h2 id="security-title">Built with privacy in mind.</h2><p>Here&apos;s what you need to know.</p></div>
          <div className="securityGrid">
            <div><i className="securityIcon securityPurple">⌁</i><strong>Private links</strong><small>High-entropy links that are difficult to guess.</small></div>
            <div><i className="securityIcon securityBlue">▤</i><strong>Secure storage</strong><small>Links and codes are stored as hashes.</small></div>
            <div><i className="securityIcon securityGreen">✓</i><strong>We control access, not copies</strong><small>Once someone views or downloads the content, we can&apos;t prevent them from copying it.</small></div>
            <div><i className="securityIcon securityPurple">◉</i><strong>No tracking</strong><small>Moog doesn&apos;t require an account and doesn&apos;t use third-party analytics tracking.</small></div>
          </div>
          <p className="securityDisclosureText">Moog stores shared content on the server so it can deliver the share. It is access-controlled, not end-to-end encrypted.</p>
        </section>

        <section className="faqArea" id="faq" aria-labelledby="faq-title">
          <section className="faq" aria-labelledby="faq-title"><div className="eyebrow">FAQ</div><h3 id="faq-title">Frequently asked questions</h3>
          {[
            ["Is my share end-to-end encrypted?", "Not yet. Moog currently protects access to server-stored content, but the server can technically read active share content. Treat it as temporary access control, not zero-knowledge encryption."],
            ["Do I need an account?", "No. Sending and receiving are both account-free."],
            ["How long do shares stay alive?", "Choose from 1 minute to 7 days when you create a share."],
            ["Can someone copy what I shared?", "Yes. Moog controls access, not copies. Screenshots and copied content cannot be taken back."],
            ["What can I share?", "Text, supported code formats, and JPG, PNG, GIF, or WebP photos up to 10 MB."],
          ].map(([question, answer], index) => (
            <details key={question} open={openFaq === index}>
              <summary onClick={(event) => { event.preventDefault(); setOpenFaq(openFaq === index ? null : index); }}>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}</section>
          <aside className="contactCard"><div className="contactIcon">✉</div><h3>Still have questions?</h3><p>We&apos;re here to help. If you need more information, feel free to reach out.</p><a href="/contact">Contact us <span>→</span></a></aside>
        </section>
        <footer className="siteFooter"><div className="footerBrand"><strong>Moog</strong><span>Moog controls access, not copies.</span></div><nav className="footerLinks" aria-label="Footer"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/recent">Recent shares</a><a href="/contact">Contact</a><a href="/report-abuse">Report abuse</a></nav><div className="footerLegal">© 2026 Moog</div></footer>
      </div>
    </main>
  );
}
