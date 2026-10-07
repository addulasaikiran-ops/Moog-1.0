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

  async function revokeShare(targetRevokeUrl = revokeUrl) {
    if (!targetRevokeUrl) return;
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
      setRevoked(targetRevokeUrl === revokeUrl);
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
            ? "This share has expired"
            : body.reason === "revoked"
              ? "This share was revoked"
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
          <a className="logo" href="/" aria-label="Moog home"><span className="logoMark">M</span><span>moog</span></a>
          <nav className="topNav"><a href="#about-moog">About</a><div className="badge"><span className="pulse" /> temporary by design</div></nav>
        </header>

        <section className="hero">
          <div className="eyebrow">MOOG 1.0 · PRIVATE TEMPORARY SHARING</div>
          <h1>Say it once.<br /><span>Then let it disappear.</span></h1>
          <p className="heroCopy">Paste text or code, choose the format, create a private link, and decide exactly how long it stays alive.</p>
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
                  onPaste={(event) => {
                    if (mode !== "photo") return;
                    const image = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
                    if (image) { event.preventDefault(); handleFile(image); }
                  }}
                >
                  {previewUrl ? <img src={previewUrl} alt="Selected preview" /> : <div className="photoDrop"><strong>Drop an image here</strong><span>or choose a file below</span></div>}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => handleFile(event.target.files?.[0] ?? null)} />
                  <button className="copy" type="button" onClick={() => fileInputRef.current?.click()}>Choose image</button>
                </div>
              ) : null}

              <div className="lifetimeSection">
                <div className="lifetimeHeader"><span>LINK LIFETIME</span><strong>Private link · {EXPIRY_OPTIONS.find((option) => option.value === expiryMinutes)?.label ?? "1 hour"}</strong></div>
                <div className="lifetimePills" role="group" aria-label="Link lifetime">
                  {EXPIRY_OPTIONS.map((option) => <button key={option.value} type="button" className={expiryMinutes === option.value ? "lifetimePill active" : "lifetimePill"} onClick={() => setExpiryMinutes(option.value)}>{option.label.replace(" minutes", " min").replace(" minute", " min").replace(" hours", " hr").replace(" hour", " hr")}</button>)}
                </div>
              </div>
              <div className="optionsRow">
                <label className="optionField accessKeyField"><span>Access key <small>optional</small></span><div className="secretInput"><input type={showAccessKey ? "text" : "password"} value={accessKey} onChange={(event) => setAccessKey(event.target.value)} maxLength={128} placeholder="Add an access key" aria-describedby="access-key-note" /><button type="button" className="toggleSecret" aria-label={showAccessKey ? "Hide access key" : "Show access key"} onClick={() => setShowAccessKey((value) => !value)}>{showAccessKey ? "◉" : "○"}</button></div><small id="access-key-note" className="optionNote">Recipients enter this to open the share.</small></label>
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
              <div className="resultLinkRow"><a href={url} target="_blank" rel="noreferrer">{url}</a><button className="copy" type="button" onClick={() => void copyValue(url, "link")}>{copied === "link" ? "Copied ✓" : "⧉ Copy"}</button></div>
              <div className="uniqueCodeBox"><div><span>Unique code</span><strong>{code}</strong></div><button className="copy codeCopyButton" type="button" onClick={() => void copyValue(code, "code")}>{copied === "code" ? "Copied ✓" : "⧉ Copy"}</button></div>
              <p className="resultNote">The code and revoke link are shown only once. Copy them now.</p><div className="revokeLinkRow"><span>Private revoke link</span><button className="copy" type="button" onClick={() => void copyValue(revokeUrl, "revoke")}>{copied === "link" ? "Copied ✓" : "⧉ Copy"}</button></div><p className="resultWarning">Save this. It can&apos;t be recovered.</p><div className="resultBottom"><span className="expiryStatus"><b>Expires in</b> {remaining > 0 ? formatCountdown(remaining) : "0s"}{viewOnce ? " · view once" : ""}{accessKey ? " · protected" : ""}</span><button className="revokeNow" type="button" onClick={() => void revokeShare()} disabled={revokeLoading || revoked || remaining <= 0}>{revoked ? "Revoked ✓" : revokeLoading ? "Revoking…" : "Revoke now"}</button></div>
            </div>
          </section>
        ) : null}

        {tab === "send" && recentShares.length ? (
          <section className="recentShares card" aria-labelledby="recent-shares-title">
            <div className="recentHeader"><div><div className="fieldLabel" id="recent-shares-title">RECENT SHARES ON THIS DEVICE</div><p>Saved only on this device. Clearing your browser data removes it.</p></div></div>
            <div className="recentList">{recentShares.map((item) => { const expired = new Date(item.expiresAt).getTime() <= Date.now(); return <div className="recentItem" key={item.revokeUrl}><div><strong>{item.type === "photo" ? "Photo" : item.type === "code" ? "Code" : "Text"}</strong><small>{expired ? "Expired" : `Active · ${formatCountdown(new Date(item.expiresAt).getTime() - Date.now())} left`}</small></div><div className="recentActions"><button className="copy" type="button" onClick={() => void copyValue(item.revokeUrl, "revoke")}>Copy revoke link</button>{!expired ? <button className="revokeNow" type="button" onClick={() => void revokeShare(item.revokeUrl)}>Revoke now</button> : null}<button className="textButton" type="button" onClick={() => removeRecentShare(item.revokeUrl)}>Remove</button></div></div>})}</div>
          </section>
        ) : null}

        <section className="stepsRow" aria-label="Moog in three steps">
          <div className="stepCard"><span>01</span><strong>Paste</strong><small>Add something private without an account.</small></div>
          <div className="stepCard"><span>02</span><strong>Share</strong><small>Send the private link or unique code.</small></div>
          <div className="stepCard"><span>03</span><strong>Disappear</strong><small>It expires automatically, or you revoke it early.</small></div>
        </section>

        <section className="aboutMoog" id="about-moog" aria-labelledby="about-title">
          <div className="aboutIntro"><div className="eyebrow">ABOUT MOOG</div><h2 id="about-title">Private sharing. <span>Nothing extra.</span></h2></div>
          <div className="featureGrid">
            <div className="featureCard"><i>↗</i><strong>Private links</strong><small>High-entropy links designed for temporary access.</small></div>
            <div className="featureCard"><i>◷</i><strong>Automatic expiry</strong><small>Choose a lifetime from 1 minute to 24 hours.</small></div>
            <div className="featureCard"><i>×</i><strong>Creator revoke</strong><small>End an active share whenever you need to.</small></div>
            <div className="featureCard"><i>⌁</i><strong>Password protection</strong><small>Add an access key for another layer of control.</small></div>
            <div className="featureCard"><i>1×</i><strong>View once</strong><small>Reveal a share once when the moment calls for it.</small></div>
            <div className="featureCard"><i>&lt;/&gt;</i><strong>Text &amp; code</strong><small>Paste plain text or supported code formats.</small></div>
            <div className="featureCard"><i>□</i><strong>Photo sharing</strong><small>Share JPG, PNG, GIF, or WebP images up to 10 MB.</small></div>
          </div>
        </section>

        <section className="howMoog" aria-labelledby="how-moog-title">
          <div className="howIntro"><div className="eyebrow">THE DETAILS</div><h2 id="how-moog-title">How Moog works</h2><p>Create, share, receive, gone.</p></div>
          <div className="howGrid">
            <div className="howCard"><span className="howIcon" aria-hidden="true">＋</span><strong>Create</strong><small>Add text, code, or a photo and pick an expiry.</small></div>
            <div className="howCard"><span className="howIcon" aria-hidden="true">↗</span><strong>Share</strong><small>Send the link or the unique code.</small></div>
            <div className="howCard"><span className="howIcon" aria-hidden="true">↓</span><strong>Receive</strong><small>Open it without an account, on any device.</small></div>
            <div className="howCard"><span className="howIcon" aria-hidden="true">×</span><strong>Gone</strong><small>It expires, or you revoke it live.</small></div>
          </div>
          <div className="facts" aria-label="Moog facts"><span>◷ 1 min to 24 hours</span><span>⌁ Optional access key</span><span>◉ View once</span><span>▧ Photos up to 10 MB</span><span>◎ No accounts</span></div>
          <p className="screenshotNote">Moog controls access, not copies. A screenshot cannot be taken back.</p>
          <section className="securitySection"><div className="eyebrow">SECURITY & PRIVACY</div><h3>Private by default.</h3><p>Tokens and unique codes are stored as hashes. Expired and revoked shares are rejected by the server, and open viewers detect revocation within seconds. Moog cannot prevent screenshots or copies.</p></section>
          <section className="faq" aria-labelledby="faq-title"><div className="eyebrow">FAQ</div><h3 id="faq-title">Questions, answered.</h3><details><summary>Do I need an account?</summary><p>No. Sending and receiving are both account-free.</p></details><details><summary>How long do shares stay alive?</summary><p>Choose from 1 minute to 24 hours when you create a share.</p></details><details><summary>Can I revoke a share early?</summary><p>Yes. Keep the private revoke link shown after creation and use it while the share is active.</p></details><details><summary>Can someone copy what I shared?</summary><p>Yes. Moog controls access, not copies. Screenshots and copied content cannot be taken back.</p></details><details><summary>What can I share?</summary><p>Text, supported code formats, and JPG, PNG, GIF, or WebP photos up to 10 MB.</p></details></section>
        </section>

        <footer className="siteFooter"><div className="footerBrand"><strong>moog</strong><span>Moog controls access, not copies.</span></div><nav className="footerLinks" aria-label="Footer"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav><div className="footerLegal">moog 1.0 · © 2026</div></footer>
      </div>
    </main>
  );
}
