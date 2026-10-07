"use client";

import { ClipboardEvent, DragEvent, FormEvent, useEffect, useRef, useState } from "react";

type Expiry = 1 | 5 | 15 | 30 | 60 | 360 | 1440;
type Tab = "send" | "receive";

const languages = [
  ["text", "Plain text"], ["javascript", "JavaScript"], ["typescript", "TypeScript"], ["python", "Python"], ["html", "HTML"], ["css", "CSS"], ["json", "JSON"], ["sql", "SQL"], ["bash", "Bash"], ["java", "Java"], ["csharp", "C#"], ["cpp", "C++"], ["go", "Go"], ["rust", "Rust"], ["php", "PHP"], ["markdown", "Markdown"],
] as const;
const expiryLabels: Record<Expiry, string> = { 1: "1 minute", 5: "5 minutes", 15: "15 minutes", 30: "30 minutes", 60: "1 hour", 360: "6 hours", 1440: "24 hours" };

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`;
}
function formatReceiveCode(value: string): string {
  const raw = value.toUpperCase().replace(/[\s-]/g, "").replace(/[^A-Z0-9]/g, "").slice(0, 10);
  if (!raw) return "";
  const prefix = raw.startsWith("MG") ? "MG" : raw.slice(0, 2);
  const body = raw.startsWith("MG") ? raw.slice(2) : raw.slice(2);
  return prefix + (body.length ? "-" + body.slice(0, 4) : "") + (body.length > 4 ? "-" + body.slice(4, 8) : "");
}

export default function HomePage() {

  const [tab, setTab] = useState<Tab>("send");
  const [text, setText] = useState("");
  const [expiry, setExpiry] = useState<Expiry>(60);
  const [url, setUrl] = useState("");
  const [revokeUrl, setRevokeUrl] = useState("");
  const [code, setCode] = useState("");
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"link" | "code" | "">("");
  const [accessKey, setAccessKey] = useState("");
  const [viewOnce, setViewOnce] = useState(false);
  const [language, setLanguage] = useState("text");
  const [mode, setMode] = useState<"text" | "code" | "photo">("text");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [receiveCode, setReceiveCode] = useState("");
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveError, setReceiveError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("tab");
    if (requested === "receive" || requested === "send") setTab(requested);
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => setRemaining(new Date(expiresAt).getTime() - Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  function changeTab(next: Tab) {
    setTab(next);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", next);
    window.history.replaceState(null, "", "?" + params.toString());
    if (next === "receive") setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setUrl(""); setRevokeUrl(""); setCode(""); setRevoked(false); setCopied(""); setExpiresAt("");
    if (mode === "photo" ? !photo : !text.trim()) { setError("Write something first."); return; }
    setLoading(true);
    try {
      let response: Response;
      if (mode === "photo" && photo) {
        const formData = new FormData();
        formData.append("file", photo); formData.append("text", photoCaption); formData.append("expiryMinutes", String(expiry));
        if (accessKey) formData.append("password", accessKey);
        formData.append("viewOnce", String(viewOnce));
        response = await fetch("/api/shares", { method: "POST", body: formData });
      } else {
        response = await fetch("/api/shares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, expiryMinutes: expiry, password: accessKey || undefined, viewOnce, language: effectiveLanguage }),
        });
      }
      const data = (await response.json()) as { url?: string; revokeUrl?: string; code?: string; expiresAt?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not create link.");
      setUrl(data.url ?? ""); setRevokeUrl(data.revokeUrl ?? ""); setCode(data.code ?? ""); setExpiresAt(data.expiresAt ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }

  async function revokeShare() {
    if (!revokeUrl || revokeLoading || revoked) return;
    if (!window.confirm("Revoke this share now? Anyone currently viewing it will lose access.")) return;
    const revokeToken = new URL(revokeUrl).pathname.split("/").filter(Boolean).pop();
    if (!revokeToken) { setError("Could not revoke this share."); return; }
    setRevokeLoading(true); setError("");
    try {
      const response = await fetch("/api/revokes/" + revokeToken, { method: "POST", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Could not revoke this share.");
      setRevoked(true); setRemaining(0);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not revoke this share."); }
    finally { setRevokeLoading(false); }
  }

  async function copyValue(value: string, kind: "link" | "code") {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(""), 1600);
    } catch { setError("Could not copy. You can select it manually."); }
  }

  async function receiveShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!receiveCode || receiveLoading) return;
    setReceiveLoading(true); setReceiveError("");
    try {
      const response = await fetch("/api/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ code: receiveCode }),
      });
      const data = (await response.json()) as { token?: string; error?: string; reason?: string };
      if (!response.ok) {
        if (response.status === 429) throw new Error("Too many attempts, try again later");
        if (data.reason === "expired") throw new Error("This share expired");
        if (data.reason === "revoked") throw new Error("This share was revoked");
        throw new Error("Code not found");
      }
      if (!data.token) throw new Error("Code not found");
      window.location.assign("/s/" + data.token);
    } catch (err) {
      setReceiveError(err instanceof Error ? err.message : "Code not found");
    } finally { setReceiveLoading(false); }
  }

  function selectPhoto(file: File | undefined) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) { setError("Use JPG, PNG, GIF, or WebP."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be 10 MB or smaller."); return; }
    setPhoto(file); setError(""); setUrl(""); setRevokeUrl(""); setCode("");
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }
  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const item = Array.from(event.clipboardData.items).find((entry) => entry.type.startsWith("image/"));
    if (item) { event.preventDefault(); selectPhoto(item.getAsFile() ?? undefined); }
  }
  function handleDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); selectPhoto(event.dataTransfer.files?.[0]); }

  const expiryLabel = expiryLabels[expiry];
  const effectiveLanguage = mode === "code" ? language : "text";

  return (
    <main className="home">
      <div className="ambient ambientOne" /><div className="ambient ambientTwo" />
      <div className="shell">
        <header className="topbar">
          <a className="logo" href="/" aria-label="Moog home"><span className="logoMark">M</span><span>moog</span></a>
          <nav className="topNav"><a href="#about-moog">About</a><div className="badge"><span className="pulse" /> temporary by design</div></nav>
        </header>

        <section className="hero">
          <div className="eyebrow">MOOG 1.0 · PRIVATE TEMPORARY SHARING</div>
          <h1>Share it.<br /><span>Then it's gone.</span></h1>
          <p className="heroCopy">Text, code, or photos with a private link and a unique code. Create once, receive anywhere, and let it expire.</p>
        </section>

        <div className="shareTabs" role="tablist" aria-label="Share mode">
          <button type="button" role="tab" aria-selected={tab === "send"} className={tab === "send" ? "shareTab active" : "shareTab"} onClick={() => changeTab("send")}>↗ <span>Send</span></button>
          <button type="button" role="tab" aria-selected={tab === "receive"} className={tab === "receive" ? "shareTab active" : "shareTab"} onClick={() => changeTab("receive")}>↓ <span>Receive</span></button>
        </div>

        {tab === "send" ? (
          <section className="composer card" aria-labelledby="send-title">
            <div className="srOnly" id="send-title">Send a private share</div>
            <form onSubmit={handleSubmit}>
              <div className="composerTop">
                <div><div className="fieldLabel">{mode === "photo" ? "PHOTO" : "MESSAGE"}</div><div className="editorHint">{mode === "photo" ? "Upload, drag & drop, or paste an image." : user ? "Paste text or code. Your account owns the revoke control." : "Sign in above to create and manage private shares."}</div></div>
                {mode === "photo" ? <div className="counter">10 MB max</div> : <div className="counter">{text.length.toLocaleString()} / 100,000</div>}
              </div>
              {mode !== "photo" ? <textarea value={text} onChange={(event) => { setText(event.target.value); setError(""); setUrl(""); }} placeholder="Type or paste something private…" maxLength={100000} aria-label="Text to share" autoFocus /> : null}
              <div className="modeToggle" role="group" aria-label="Content mode">
                <button type="button" className={mode === "text" ? "modeButton active" : "modeButton"} onClick={() => setMode("text")}>Text</button>
                <button type="button" className={mode === "code" ? "modeButton active" : "modeButton"} onClick={() => setMode("code")}>Code</button>
                <button type="button" className={mode === "photo" ? "modeButton active" : "modeButton"} onClick={() => { setMode("photo"); setText(""); }}>Photo</button>
              </div>
              {mode === "photo" ? <div className="photoComposer">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={(e) => selectPhoto(e.target.files?.[0])} />
                <div className="photoDrop" tabIndex={0} onPaste={handlePaste} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                  {photo ? <div className="photoPreviewWrap"><img className="photoPreview" src={photoPreview} alt="Selected preview" /><button type="button" className="photoOverlay" onClick={(e) => { e.stopPropagation(); setPhoto(null); setPhotoPreview(""); }}>Remove</button></div> :
                    <div className="photoDropEmpty"><div className="photoDropGlyph" aria-hidden="true">+</div><div className="photoDropCopy"><strong>Drop an image here</strong><span>or paste from your clipboard</span></div><button type="button" className="photoBrowse" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Browse files</button><small>JPG · PNG · GIF · WebP · max 10 MB</small></div>}
                </div>
                <input className="sharePassword" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} maxLength={1000} placeholder="Optional photo caption" aria-label="Optional photo caption" />
              </div> : null}
              {mode === "code" ? <div className="codeToolbar"><div><div className="fieldLabel">FORMAT</div><div className="expiryHint">Choose a language for code sharing.</div></div><select className="languageSelect" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Code language">{languages.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div> : null}
              <div className="expiryPicker"><div><div className="fieldLabel">LINK LIFETIME</div><div className="expiryHint">The link stops working after {expiryLabel}.</div></div><div className="expiryOptions" role="group" aria-label="Link expiry">{[1,5,15,30,60,360,1440].map((minutes) => <button key={minutes} type="button" className={expiry === minutes ? "expiryOption active" : "expiryOption"} onClick={() => setExpiry(minutes as Expiry)} aria-pressed={expiry === minutes}>{minutes === 1440 ? "24 hr" : minutes === 360 ? "6 hr" : minutes === 60 ? "1 hr" : minutes + " min"}</button>)}</div></div>
              <div className="advancedControls"><input className="sharePassword" type="password" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} placeholder="Optional access key" maxLength={128} aria-label="Optional access key" /><label className="viewOnce"><input type="checkbox" checked={viewOnce} onChange={(e) => setViewOnce(e.target.checked)} /> View once</label></div>
              <div className="composerBottom"><div className="trust"><span className="trustIcon">✦</span><span>{mode === "photo" ? "Photo" : mode === "code" ? "Code · " + (languages.find(([v]) => v === language)?.[1] ?? language) : viewOnce ? "Burns after one view" : "Private link"}{accessKey ? " · protected" : ""} · {expiryLabel}</span></div><button className="primary" type="submit" disabled={loading || (mode === "photo" ? !photo : !text.trim())}>{loading ? <><span className="spinner" /> Creating secure link…</> : <>Create private link <span className="arrow">↗</span></>}</button></div>
            </form>
            {error ? <p className="error" role="alert"><span>!</span>{error}</p> : null}

            {url ? <div className="result resultExpanded" aria-live="polite">
              <div className="resultIcon">✓</div>
              <div className="resultBody">
                <div className="resultLabel">PRIVATE LINK CREATED</div>
                <div className="resultLinkRow"><a href={url} target="_blank" rel="noreferrer">{url}</a><button className="copy" type="button" onClick={() => void copyValue(url, "link")}>{copied === "link" ? "Copied ✓" : "Copy link"}</button></div>
                <div className="uniqueCodeBox"><div><span>Unique code</span><strong>{code}</strong></div><button className="copy codeCopyButton" type="button" onClick={() => void copyValue(code, "code")}>{copied === "code" ? "Copied ✓" : "Copy code"}</button></div>
                <div className="resultBottom"><span>Expires in {remaining > 0 ? formatCountdown(remaining) : "expired"}{viewOnce ? " · view once" : ""}{accessKey ? " · protected" : ""}</span><button className="revokeNow" type="button" onClick={revokeShare} disabled={revokeLoading || revoked || remaining <= 0}>{revoked ? "Revoked ✓" : revokeLoading ? "Revoking…" : "Revoke now"}</button></div>
              </div>
            </div> : null}
          </section>
        ) : (
          <section className="receiveCard card" aria-labelledby="receive-title">
            <div className="receiveHeader"><span className="receiveGlyph" aria-hidden="true">↓</span><div><h2 id="receive-title">Receive</h2><p>Got a code from someone? Paste it here to open what they shared. No account needed.</p></div></div>
            <form onSubmit={receiveShare}>
              <label className="receiveLabel" htmlFor="receive-code">Unique code</label>
              <input id="receive-code" className="receiveInput" value={receiveCode} onChange={(e) => { setReceiveCode(formatReceiveCode(e.target.value)); setReceiveError(""); }} placeholder="MG-7K4Q-92XF" inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-describedby="receive-help" />
              <p id="receive-help" className="receiveHint">Codes can be pasted with or without dashes or spaces.</p>
              {receiveError ? <p className="receiveError" role="alert">{receiveError}</p> : null}
              <button className="receiveOpen primary" type="submit" disabled={!receiveCode || receiveLoading}>{receiveLoading ? <><span className="spinner" /> Opening share…</> : <>Open share <span>→</span></>}</button>
            </form>
            <div className="receiveNote"><span aria-hidden="true">⌁</span><span>Locked shares ask for the access key. View-once shares open through their normal one-time reveal.</span></div>
          </section>
        )}

        <section className="howMoog" id="about-moog" aria-labelledby="about-moog-title">
          <div className="howIntro"><div className="eyebrow">THE DETAILS</div><h2 id="about-moog-title">How Moog works</h2><p>Simple sharing with a short life by design.</p></div>
          <div className="howGrid">
            <div className="howCard"><span className="howIcon">01</span><strong>Create</strong><small>Add text, code, or a photo and pick an expiry.</small></div>
            <div className="howCard"><span className="howIcon">02</span><strong>Share</strong><small>Send the link or the unique code.</small></div>
            <div className="howCard"><span className="howIcon">03</span><strong>Receive</strong><small>Open it without an account, on any device.</small></div>
            <div className="howCard"><span className="howIcon">04</span><strong>Gone</strong><small>It expires, or you revoke it live.</small></div>
          </div>
          <div className="facts" aria-label="Moog facts"><span>◷ 1 min to 24 hours</span><span>⌁ Optional access key</span><span>◉ View once</span><span>▧ Photos up to 10 MB</span></div>
          <p className="screenshotNote">Moog controls access, not copies. A screenshot can't be taken back.</p>
        </section>

        <footer className="siteFooter"><div className="footerBrand"><strong>moog</strong><span>temporary sharing, intentionally temporary.</span></div><div className="footerLegal">@moogmoog-1.0 · © 2026 · All rights reserved.</div></footer>
      </div>
    </main>
  );
}