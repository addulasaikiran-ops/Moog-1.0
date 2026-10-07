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
  const [error, setError] = useState("");
  const [receiveCode, setReceiveCode] = useState("");
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveError, setReceiveError] = useState("");
  const [recentShares, setRecentShares] = useState<RecentShare[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem("moog_recent_shares") ?? "[]") as unknown;
      if (Array.isArray(stored)) {
        const now = Date.now();
        const valid = stored.filter((entry): entry is RecentShare => {
          if (!entry || typeof entry !== "object") return false;
          const item = entry as Partial<RecentShare>;
          return (item.type === "text" || item.type === "code" || item.type === "photo") &&
            typeof item.createdAt === "string" &&
            typeof item.expiresAt === "string" &&
            typeof item.revokeUrl === "string" &&
            new Date(item.expiresAt).getTime() > now;
        });
        setRecentShares(valid);
        window.localStorage.setItem("moog_recent_shares", JSON.stringify(valid));
      }
    } catch {
      setRecentShares([]);
    }

    const value = new URLSearchParams(window.location.search).get("tab");
    if (value === "receive") setTab("receive");
    const onPopState = () => setTab(new URLSearchParams(window.location.search).get("tab") === "receive" ? "receive" : "send");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const prune = () => {
      setRecentShares((current) => {
        const valid = current.filter((item) => new Date(item.expiresAt).getTime() > Date.now());
        try { window.localStorage.setItem("moog_recent_shares", JSON.stringify(valid)); } catch {}
        return valid;
      });
    };
    prune();
    const interval = window.setInterval(prune, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (!url || !revokeUrl || revoked) return;
    const token = revokeUrl.split("/").pop();
    if (!token) return;

    let active = true;
    let controller: AbortController | null = null;

    const check = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch(url, { method: "HEAD", cache: "no-store", signal: controller.signal });
        if (active && response.status === 404) setRevoked(true);
      } catch {
        // Transient errors should not revoke the UI state.
      }
    };

    void check();
    const interval = window.setInterval(() => void check(), 2000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [url, revokeUrl, revoked]);

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

  function saveRecentShare(entry: RecentShare) {
    setRecentShares((current) => {
      const next = [entry, ...current.filter((item) => item.revokeUrl !== entry.revokeUrl)].slice(0, 10);
      try { window.localStorage.setItem("moog_recent_shares", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function removeRecentShare(revokeUrl: string) {
    setRecentShares((current) => {
      const next = current.filter((item) => item.revokeUrl !== revokeUrl);
      try { window.localStorage.setItem("moog_recent_shares", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  async function copyValue(value: string, kind: "link" | "code" | "revoke") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind === "revoke" ? "link" : kind);
      window.setTimeout(() => setCopied(""), 1400);
    } catch {
      setError("Could not copy. Please copy it manually.");
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setUrl("");
    setRevokeUrl("");
    setCode("");
    setExpiresAt("");
    setRemaining(0);
    setRevoked(false);

    if (mode === "photo" && !file) {
      setError("Choose an image first.");
      return;
    }
    if (mode !== "photo" && !text.trim()) {
      setError("Text cannot be empty.");
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
            password: accessKey,
            viewOnce,
            expiryMinutes,
          }),
        });
      }

      const body = (await response.json()) as { url?: string; revokeUrl?: string; code?: string; expiresAt?: string; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not create link.");
      setUrl(body.url ?? "");
      setRevokeUrl(body.revokeUrl ?? "");
      setCode(body.code ?? "");
      setExpiresAt(body.expiresAt ?? "");
      if (body.revokeUrl && body.expiresAt) {
        saveRecentShare({ type: mode, createdAt: new Date().toISOString(), expiresAt: body.expiresAt, revokeUrl: body.revokeUrl });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create link.");
    } finally {
      setLoading(false);
    }
  }

  async function revokeShare() {
    if (!revokeUrl) return;
    setRevokeLoading(true);
    setError("");
    try {
      const response = await fetch(targetRevokeUrl, {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const body = (await response.json()) as { revoked?: boolean; error?: string };
      if (!response.ok || !body.revoked) {
        setError(body.error ?? "Share is already unavailable.");
        return;
      }
      setRevoked(true);
      removeRecentShare(targetRevokeUrl);
    } catch {
      setError("Could not revoke the share right now.");
    } finally {
      setRevokeLoading(false);
    }
  }

  async function receiveShare(event: FormEvent) {
    event.preventDefault();
    setReceiveError("");
    const normalized = formatReceiveCode(receiveCode);
    if (!isValidCode(normalized)) {
      setReceiveError("Enter a valid Moog code like MG-7K4Q-92XF.");
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
            ? "That share has expired."
            : body.reason === "revoked"
              ? "That share was revoked."
              : body.error ?? "Share unavailable.";
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
          <a className="logo" href="/" aria-label="Moog home"><span className="logoMark">M</span><span>moog</span></a>
          <nav className="topNav"><a href="#about-moog">About</a><div className="badge"><span className="pulse" /> temporary by design</div></nav>
        </header>

        <section className="hero">
          <div className="eyebrow">MOOG 1.0 · PRIVATE TEMPORARY SHARING</div>
          <h1>Share it.<br /><span>Then it’s gone.</span></h1>
          <p className="heroCopy">Text, code, or photos with a private link and a unique code. Create once, receive anywhere, and let it expire. No account needed.</p>
        </section>

        <div className="shareTabs" role="tablist" aria-label="Share mode" onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); changeTab("receive"); } if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); changeTab("send"); } }}>
          <button type="button" role="tab" tabIndex={tab === "send" ? 0 : -1} aria-selected={tab === "send"} className={tab === "send" ? "shareTab active" : "shareTab"} onClick={() => changeTab("send")}>↗ <span>Send</span></button>
          <button type="button" role="tab" tabIndex={tab === "receive" ? 0 : -1} aria-selected={tab === "receive"} className={tab === "receive" ? "shareTab active" : "shareTab"} onClick={() => changeTab("receive")}>↓ <span>Receive</span></button>
        </div>

        {tab === "send" ? (
          <section className="composer card" aria-labelledby="send-title">
            <div className="srOnly" id="send-title">Send a private share</div>
            <form onSubmit={handleSubmit}>
              <div className="composerTop">
                <div><div className="fieldLabel">{mode === "photo" ? "PHOTO" : "MESSAGE"}</div><div className="editorHint">{mode === "photo" ? "Upload, drag & drop, or paste an image." : "Paste text or code. No account required."}</div></div>
                {mode === "photo" ? <div className="counter">10 MB max</div> : <div className="counter">{text.length.toLocaleString()} / 100,000</div>}
              </div>

              {mode !== "photo" ? <textarea value={text} onChange={(event) => { setText(event.target.value); setError(""); setUrl(""); }} placeholder="Type or paste something private…" maxLength={100000} aria-label="Text to share" autoFocus /> : null}

              <div className="modeToggle" role="group" aria-label="Content mode">
                <button type="button" className={mode === "text" ? "modeButton active" : "modeButton"} onClick={() => setMode("text")}>Text</button>
                <button type="button" className={mode === "code" ? "modeButton active" : "modeButton"} onClick={() => setMode("code")}>Code</button>
                <button type="button" className={mode === "photo" ? "modeButton active" : "modeButton"} onClick={() => { setMode("photo"); setText(""); }}>Photo</button>
              </div>

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
                >
                  {previewUrl ? <img src={previewUrl} alt="Selected preview" /> : <div className="photoDrop"><strong>Drop an image here</strong><span>or choose a file below</span></div>}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
                  <button className="copy" type="button" onClick={() => fileInputRef.current?.click()}>Choose image</button>
                </div>
              ) : null}

              <div className="optionsRow">
                <label className="optionField"><span>Expires</span><select value={expiryMinutes} onChange={(event) => setExpiryMinutes(Number(event.target.value))}>{EXPIRY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label className="optionField"><span>Access key <small>optional</small></span><div className="secretInput"><input type={showAccessKey ? "text" : "password"} value={accessKey} onChange={(event) => setAccessKey(event.target.value)} maxLength={128} placeholder="Add a password" aria-describedby="access-key-note" /><button type="button" className="toggleSecret" aria-label={showAccessKey ? "Hide access key" : "Show access key"} onClick={() => setShowAccessKey((value) => !value)}>{showAccessKey ? "Hide" : "Show"}</button></div><small id="access-key-note" className="optionNote">Recipients must enter this to open the share.</small></label>
                <label className="checkField"><input type="checkbox" checked={viewOnce} onChange={(event) => setViewOnce(event.target.checked)} /><span>View once</span></label>
              </div>

              {error ? <div className="formError" role="alert">{error}</div> : null}

              <button className="primary createButton" type="submit" disabled={loading}>{loading ? <><span className="spinner" /> Creating…</> : <>Create private share <span>→</span></>}</button>
            </form>
          </section>
        ) : (
          <section className="receiveCard card" aria-labelledby="receive-title">
            <div className="receiveHeader"><span className="receiveGlyph" aria-hidden="true">↓</span><div><h2 id="receive-title">Receive</h2><p>Got a code from someone? Paste it here to open what they shared. No account needed.</p></div></div>
            <form onSubmit={receiveShare}>
              <label className="receiveLabel" htmlFor="receive-code">Unique code</label>
              <input id="receive-code" className="receiveInput" value={receiveCode} onChange={(event) => { setReceiveCode(formatReceiveCode(event.target.value)); setReceiveError(""); }} placeholder="MG-7K4Q-92XF" inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-describedby="receive-help" />
              <p id="receive-help" className="receiveHint">Codes can be pasted with or without dashes or spaces.</p>
              {receiveError ? <p className="receiveError" role="alert">{receiveError}</p> : null}
              <button className="receiveOpen primary" type="submit" disabled={!receiveCode || receiveLoading}>{receiveLoading ? <><span className="spinner" /> Opening share…</> : <>Open share <span>→</span></>}</button>
            </form>
            <div className="receiveNote"><span aria-hidden="true">⌁</span><span>Locked shares ask for the access key. View-once shares open through their normal one-time reveal.</span></div>
          </section>
        )}

        {url ? (
          <section className="result resultExpanded" aria-live="polite">
            <div className="resultIcon">✓</div>
            <div className="resultBody">
              <div className="resultLabel">PRIVATE LINK CREATED</div>
              <div className="resultLinkRow"><a href={url} target="_blank" rel="noreferrer">{url}</a><button className="copy" type="button" onClick={() => void copyValue(url, "link")}>{copied === "link" ? "Copied ✓" : "Copy link"}</button></div>
              <div className="uniqueCodeBox"><div><span>Unique code</span><strong>{code}</strong></div><button className="copy codeCopyButton" type="button" onClick={() => void copyValue(code, "code")}>{copied === "code" ? "Copied ✓" : "Copy code"}</button></div>
              <p className="resultNote">The code and revoke link are shown only once. Copy them now.</p><div className="revokeLinkRow"><span>Revoke link</span><button className="copy" type="button" onClick={() => void copyValue(revokeUrl, "revoke")}>Copy revoke link</button></div><p className="resultWarning">Save your revoke link. It can&apos;t be recovered.</p><div className="resultBottom"><span>Active for {remaining > 0 ? formatCountdown(remaining) : "expired"} · expires at {expiresAt ? new Date(expiresAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}{viewOnce ? " · view once" : ""}{accessKey ? " · protected" : ""}</span><button className="revokeNow" type="button" onClick={() => void revokeShare()} disabled={revokeLoading || revoked || remaining <= 0}>{revoked ? "Revoked ✓" : revokeLoading ? "Revoking…" : "Revoke now"}</button></div>
            </div>
          </section>
        ) : null}

        {tab === "send" && recentShares.length ? (
          <section className="recentShares card" aria-labelledby="recent-shares-title">
            <div className="recentHeader"><div><div className="fieldLabel" id="recent-shares-title">RECENT SHARES ON THIS DEVICE</div><p>Saved only on this device. Clearing your browser data removes it.</p></div></div>
            <div className="recentList">{recentShares.map((item) => { const expired = new Date(item.expiresAt).getTime() <= Date.now(); return <div className="recentItem" key={item.revokeUrl}><div><strong>{item.type === "photo" ? "Photo" : item.type === "code" ? "Code" : "Text"}</strong><small>{expired ? "Expired" : `Active · ${formatCountdown(new Date(item.expiresAt).getTime() - Date.now())} left`}</small></div><div className="recentActions"><button className="copy" type="button" onClick={() => void copyValue(item.revokeUrl, "revoke")}>Copy revoke link</button>{!expired ? <button className="revokeNow" type="button" onClick={() => void revokeShare(item.revokeUrl)}>Revoke now</button> : null}<button className="textButton" type="button" onClick={() => removeRecentShare(item.revokeUrl)}>Remove</button></div></div>})}</div>
          </section>
        ) : null}

        <section className="features" aria-label="How Moog works">
          <div><span>01</span><strong>Paste</strong><small>Drop in text or code without an account.</small></div>
          <div><span>02</span><strong>Share</strong><small>Send one private link or unique code.</small></div>
          <div><span>03</span><strong>Disappear</strong><small>The link expires on the timer you choose.</small></div>
        </section>

        <section className="howMoog" id="about-moog" aria-labelledby="about-moog-title">
          <div className="howIntro"><div className="eyebrow">THE DETAILS</div><h2 id="about-moog-title">How Moog works</h2><p>Simple sharing with a short life by design.</p></div>
          <div className="howGrid">
            <div className="howCard"><span className="howIcon">01</span><strong>Create</strong><small>Add text, code, or a photo and pick an expiry.</small></div>
            <div className="howCard"><span className="howIcon">02</span><strong>Share</strong><small>Send the link or the unique code.</small></div>
            <div className="howCard"><span className="howIcon">03</span><strong>Receive</strong><small>Open it without an account, on any device.</small></div>
            <div className="howCard"><span className="howIcon">04</span><strong>Gone</strong><small>It expires, or you revoke it live.</small></div>
          </div>
          <div className="facts" aria-label="Moog facts"><span>◷ 1 min to 24 hours</span><span>⌁ Optional access key</span><span>◉ View once</span><span>▧ Photos up to 10 MB</span><span>◎ No accounts</span></div>
          <p className="screenshotNote">Moog controls access, not copies. A screenshot cannot be taken back.</p>
          <section className="securitySection"><div className="eyebrow">SECURITY & PRIVACY</div><h3>Private by default.</h3><p>Tokens and unique codes are stored as hashes. Expired and revoked shares are rejected by the server, and open viewers detect revocation within seconds. Moog cannot prevent screenshots or copies.</p></section>
          <section className="faq" aria-labelledby="faq-title"><div className="eyebrow">FAQ</div><h3 id="faq-title">Questions, answered.</h3><details><summary>Is it private?</summary><p>Shares use high-entropy private links and hashed lookup values. Optional access keys add another layer.</p></details><details><summary>Can the recipient copy it?</summary><p>Yes. Moog is designed for temporary access, not copy prevention.</p></details><details><summary>What happens when it expires?</summary><p>The server rejects the share after its expiry time.</p></details><details><summary>Can I revoke?</summary><p>Yes. Keep the private revoke control link from creation and use it while the share is active.</p></details><details><summary>Do I need an account?</summary><p>No. Both sending and receiving are account-free.</p></details><details><summary>What if I lose my revoke link?</summary><p>It can&apos;t be recovered. The share still expires on its timer.</p></details><details><summary>What file types are allowed?</summary><p>JPG, PNG, GIF, and WebP images up to 10 MB, plus text and supported code languages.</p></details></section>
        </section>

        <footer className="siteFooter"><div className="footerBrand"><strong>moog</strong><span>temporary sharing, intentionally temporary.</span></div><nav className="footerLinks" aria-label="Footer"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@moog.example">Contact</a></nav><div className="footerLegal">moog 1.0 · © 2026</div></footer>
      </div>
    </main>
  );
}
