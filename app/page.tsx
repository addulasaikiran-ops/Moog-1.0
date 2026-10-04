"use client";

import { ClipboardEvent, DragEvent, FormEvent, useRef, useState } from "react";

type Expiry = 1 | 5 | 15 | 30 | 60 | 360 | 1440;

const languages = [
  ["text", "Plain text"], ["javascript", "JavaScript"], ["typescript", "TypeScript"], ["python", "Python"], ["html", "HTML"], ["css", "CSS"], ["json", "JSON"], ["sql", "SQL"], ["bash", "Bash"], ["java", "Java"], ["csharp", "C#"], ["cpp", "C++"], ["go", "Go"], ["rust", "Rust"], ["php", "PHP"], ["markdown", "Markdown"],
] as const;

const expiryLabels: Record<Expiry, string> = { 1: "1 minute", 5: "5 minutes", 15: "15 minutes", 30: "30 minutes", 60: "1 hour", 360: "6 hours", 1440: "24 hours" };

export default function HomePage() {
  const [text, setText] = useState("");
  const [expiry, setExpiry] = useState<Expiry>(60);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [viewOnce, setViewOnce] = useState(false);
  const [language, setLanguage] = useState("text");
  const [mode, setMode] = useState<"text" | "code" | "photo">("text");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setUrl("");
    setCopied(false);

    if (mode === "photo" ? !photo : !text.trim()) {
      setError("Write something first.");
      return;
    }

    setLoading(true);
    try {
      let response: Response;

      if (mode === "photo" && photo) {
        const formData = new FormData();
        formData.append("file", photo);
        formData.append("text", photoCaption);
        formData.append("expiryMinutes", String(expiry));
        if (accessKey) formData.append("password", accessKey);
        formData.append("viewOnce", String(viewOnce));

        response = await fetch("/api/shares", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/shares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, expiryMinutes: expiry, password: accessKey || undefined, viewOnce, language: effectiveLanguage }),
        });
      }

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not create link.");
      setUrl(data.url ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy the link. You can select it manually.");
    }
  }

  const expiryLabel = expiryLabels[expiry];
  const effectiveLanguage = mode === "code" ? language : "text";

  function selectPhoto(file: File | undefined) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) { setError("Use JPG, PNG, GIF, or WebP."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be 10 MB or smaller."); return; }
    setPhoto(file); setError(""); setUrl("");
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const item = Array.from(event.clipboardData.items).find((entry) => entry.type.startsWith("image/"));
    if (item) { event.preventDefault(); selectPhoto(item.getAsFile() ?? undefined); }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    selectPhoto(event.dataTransfer.files?.[0]);
  }

  return (
    <main className="home">
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />

      <div className="shell">
        <header className="topbar">
          <a className="logo" href="/" aria-label="Moog home">
            <span className="logoMark">M</span>
            <span>moog</span>
          </a>
          <div className="badge"><span className="pulse" /> temporary by design</div>
        </header>

        <section className="hero">
          <div className="eyebrow">TEXT & CODE SHARING</div>
          <h1>Say it once.<br /><span>Then let it disappear.</span></h1>
          <p className="heroCopy">
            Paste text or code, choose the format, create a private link, and decide exactly how long it stays alive.
          </p>
        </section>

        <section className="composer card">
          <form onSubmit={handleSubmit}>
            <div className="composerTop">
              <div>
                <div className="fieldLabel">{mode === "photo" ? "PHOTO" : "MESSAGE"}</div>
                <div className="editorHint">{mode === "photo" ? "Upload, drag & drop, or paste an image." : "Paste text or code. No account. No setup."}</div>
              </div>
              {mode === "photo" ? <div className="counter">10 MB max</div> : <div className="counter">{text.length.toLocaleString()} / 100,000</div>}
            </div>

            {mode !== "photo" ? (
              <textarea
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setError("");
                  setUrl("");
                }}
                placeholder="Type or paste something private…"
                maxLength={100000}
                aria-label="Text to share"
                autoFocus
              />
            ) : null}

            <div className="modeToggle" role="group" aria-label="Content mode">
              <button type="button" className={mode === "text" ? "modeButton active" : "modeButton"} onClick={() => setMode("text")}>Text</button>
              <button type="button" className={mode === "code" ? "modeButton active" : "modeButton"} onClick={() => setMode("code")}>Code</button>
              <button type="button" className={mode === "photo" ? "modeButton active" : "modeButton"} onClick={() => { setMode("photo"); setText(""); }}>Photo</button>
            </div>

            {mode === "photo" ? (
              <div className="photoComposer">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={(e) => selectPhoto(e.target.files?.[0])} />
                <div className="photoDrop" tabIndex={0} onPaste={handlePaste} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                  {photo ? (
                    <div className="photoPreviewWrap">
                      <img className="photoPreview" src={photoPreview} alt="Selected preview" />
                      <button type="button" className="photoOverlay" onClick={(e) => { e.stopPropagation(); setPhoto(null); setPhotoPreview(""); }}>Remove</button>
                    </div>
                  ) : (
                    <div className="photoDropEmpty">
                      <div className="photoDropGlyph" aria-hidden="true">+</div>
                      <div className="photoDropCopy">
                        <strong>Drop an image here</strong>
                        <span>or paste from your clipboard</span>
                      </div>
                      <button type="button" className="photoBrowse" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        Browse files
                      </button>
                      <small>JPG · PNG · GIF · WebP · max 10 MB</small>
                    </div>
                  )}
                </div>
                <input className="sharePassword" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} maxLength={1000} placeholder="Optional photo caption" aria-label="Optional photo caption" />
              </div>
            ) : null}

            {mode === "code" ? <div className="codeToolbar">
              <div>
                <div className="fieldLabel">FORMAT</div>
                <div className="expiryHint">Choose a language for code sharing.</div>
              </div>
              <select className="languageSelect" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Code language">
                {languages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div> : null}

            <div className="expiryPicker">
              <div>
                <div className="fieldLabel">LINK LIFETIME</div>
                <div className="expiryHint">The link stops working after {expiryLabel}.</div>
              </div>
              <div className="expiryOptions" role="group" aria-label="Link expiry">
                {[1, 5, 15, 30, 60, 360, 1440].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={expiry === minutes ? "expiryOption active" : "expiryOption"}
                    onClick={() => setExpiry(minutes as Expiry)}
                    aria-pressed={expiry === minutes}
                  >
                    {minutes === 1440 ? "24 hr" : minutes === 360 ? "6 hr" : minutes === 60 ? "1 hr" : `${minutes} min`}
                  </button>
                ))}
              </div>
            </div>

            <div className="advancedControls"><input className="sharePassword" type="password" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} placeholder="Optional access key" maxLength={128} aria-label="Optional access key" /><label className="viewOnce"><input type="checkbox" checked={viewOnce} onChange={(e) => setViewOnce(e.target.checked)} /> View once</label></div>

            <div className="composerBottom">
              <div className="trust">
                <span className="trustIcon">✦</span>
                <span>{mode === "photo" ? "Photo" : mode === "code" ? `Code · ${languages.find(([v]) => v === language)?.[1] ?? language}` : (viewOnce ? "Burns after one view" : "Private link")}{accessKey ? " · protected" : ""} · {expiryLabel}</span>
              </div>
              <button className="primary" type="submit" disabled={loading || (mode === "photo" ? !photo : !text.trim())}>
                {loading ? (
                  <><span className="spinner" /> Creating secure link…</>
                ) : (
                  <>Create private link <span className="arrow">↗</span></>
                )}
              </button>
            </div>
          </form>

          {error ? (
            <p className="error" role="alert"><span>!</span>{error}</p>
          ) : null}

          {url ? (
            <div className="result" aria-live="polite">
              <div className="resultIcon">✓</div>
              <div className="resultBody">
                <div className="resultLabel">PRIVATE LINK CREATED</div>
                <a href={url} target="_blank" rel="noreferrer">{url}</a>
                <div className="resultMeta">Expires in {expiryLabel}{viewOnce ? " · view once" : ""}{accessKey ? " · protected" : ""}</div>
              </div>
              <button className="copy" type="button" onClick={copyLink}>
                {copied ? "Copied ✓" : "Copy link"}
              </button>
            </div>
          ) : null}
        </section>

        <section className="features" aria-label="How Moog works">
          <div>
            <span>01</span>
            <strong>Paste</strong>
            <small>Drop in text or code without an account.</small>
          </div>
          <div>
            <span>02</span>
            <strong>Share</strong>
            <small>Send one private link to someone.</small>
          </div>
          <div>
            <span>03</span>
            <strong>Disappear</strong>
            <small>The link expires on the timer you choose.</small>
          </div>
        </section>

        <section className="aboutMoog" aria-labelledby="about-moog-title">
          <div className="aboutIntro">
            <div className="eyebrow">ABOUT MOOG</div>
            <h2 id="about-moog-title">Private sharing.<br /><span>Nothing extra.</span></h2>
            <p>Moog is a temporary sharing tool for text, code, and images. Create a link, send it, and let it expire when you decide.</p>
          </div>
          <div className="aboutGrid">
            <div><strong>Private links</strong><small>Share without creating an account or profile.</small></div>
            <div><strong>Automatic expiry</strong><small>Choose from 1 minute to 24 hours.</small></div>
            <div><strong>Password protection</strong><small>Add an access key when a link needs another layer of control.</small></div>
            <div><strong>View once</strong><small>Make a share available for a single view.</small></div>
            <div><strong>Text & code</strong><small>Share plain text with syntax-aware code formats and line numbers.</small></div>
            <div><strong>Photo sharing</strong><small>Upload or paste JPG, PNG, GIF, and WebP images up to 10 MB.</small></div>
          </div>
        </section>

        <footer className="siteFooter">
          <div className="footerBrand"><strong>moog</strong><span>temporary sharing, intentionally temporary.</span></div>
          <div className="footerLegal">© 2026 moog · moog-1.0 · All rights reserved.</div>
        </footer>
      </div>
    </main>
  );
}
