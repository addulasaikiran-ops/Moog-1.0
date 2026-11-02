"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, Code2, FileText, Image as ImageIcon, LockKeyhole, Upload } from "lucide-react";

const EXPIRY_OPTIONS = [
  { value: 1, label: "1 minute" }, { value: 5, label: "5 minutes" },
  { value: 15, label: "15 minutes" }, { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" }, { value: 360, label: "6 hours" },
  { value: 1440, label: "24 hours" }, { value: 4320, label: "3 days" },
  { value: 10080, label: "7 days" },
] as const;
const CODE_LANGUAGES = [
  ["javascript", "JavaScript"], ["typescript", "TypeScript"], ["python", "Python"],
  ["html", "HTML"], ["css", "CSS"], ["json", "JSON"], ["sql", "SQL"],
  ["bash", "Bash"], ["java", "Java"], ["csharp", "C#"], ["cpp", "C++"],
  ["go", "Go"], ["rust", "Rust"], ["php", "PHP"], ["markdown", "Markdown"],
] as const;

export type CreatedShare = {
  url: string;
  code: string;
  revokeToken: string;
  expiresAt: string;
  passwordProtected: boolean;
  viewOnce: boolean;
  mode: "text" | "code" | "photo";
};

type RecentShare = { type: CreatedShare["mode"]; createdAt: string; expiresAt: string; url: string; code: string; passwordProtected: boolean; viewOnce: boolean; revoked?: boolean };

export default function Composer({ onCreated, onExpiryChange, compact = false }: {
  onCreated: (share: CreatedShare) => void;
  onExpiryChange?: (minutes: number) => void;
  compact?: boolean;
}) {
  const [mode, setMode] = useState<CreatedShare["mode"]>("text");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [expiryMinutes, setExpiryMinutes] = useState(1440);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [viewOnce, setViewOnce] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => { onExpiryChange?.(expiryMinutes); }, [expiryMinutes, onExpiryChange]);

  function handleFile(nextFile: File | null) {
    if (!nextFile) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(nextFile.type)) {
      setError("Use JPG, PNG, GIF, or WebP."); return;
    }
    if (nextFile.size > 10 * 1024 * 1024) { setError("Image must be 10 MB or smaller."); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile); setPreviewUrl(URL.createObjectURL(nextFile)); setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (mode === "photo" && !file) { setError("Choose an image first."); return; }
    if (mode !== "photo" && !text.trim()) { setError("Please enter some content before creating a share."); return; }
    if (passwordEnabled && !accessKey.trim()) { setError("Enter a password or turn off password protection."); return; }
    setLoading(true);
    try {
      let response: Response;
      if (mode === "photo") {
        const body = new FormData();
        body.set("file", file as File); body.set("text", text);
        body.set("password", passwordEnabled ? accessKey : "");
        body.set("viewOnce", String(viewOnce)); body.set("expiryMinutes", String(expiryMinutes));
        response = await fetch("/api/shares", { method: "POST", body });
      } else {
        response = await fetch("/api/shares", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language: mode === "code" ? language : "text", password: passwordEnabled ? accessKey : "", viewOnce, expiryMinutes }),
        });
      }
      const body = await response.json() as { url?: string; code?: string; revokeToken?: string; expiresAt?: string; error?: string };
      if (!response.ok || !body.url || !body.code || !body.revokeToken || !body.expiresAt) throw new Error(body.error ?? "Could not create link.");
      const share: CreatedShare = { url: body.url, code: body.code, revokeToken: body.revokeToken, expiresAt: body.expiresAt, passwordProtected: passwordEnabled, viewOnce, mode };
      try {
        const key = "moog-recent-shares-v1";
        const previous = JSON.parse(window.localStorage.getItem(key) ?? "[]") as RecentShare[];
        const entry: RecentShare = { type: mode, createdAt: new Date().toISOString(), expiresAt: share.expiresAt, url: share.url, code: share.code, passwordProtected: share.passwordProtected, viewOnce: share.viewOnce };
        window.localStorage.setItem(key, JSON.stringify([entry, ...previous.filter(item => item.url !== share.url)].slice(0, 30)));
      } catch { /* Local history is optional and must not block creation. */ }
      onCreated(share);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create link.");
    } finally { setLoading(false); }
  }

  return (
    <section className={compact ? "composer card composerCompact" : "composer card"} id="composer" data-ui="composer" aria-labelledby="composer-title">
      <div className="srOnly" id="composer-title">Create a share</div>
      <form onSubmit={submit}>
        <div className="composerTop"><div className="srOnly">{mode} composer</div>{mode === "photo" ? <span className="composerFieldLabel">Image</span> : <label className="composerFieldLabel" htmlFor="composer-content">{mode === "code" ? "Code content" : "Text content"}</label>}
          {mode === "photo" ? <div className="counter">10 MB max</div> : <div className={text.length >= 90000 ? "counter counterNearLimit" : "counter"} aria-live="off">{text.length.toLocaleString()} / 100,000</div>}
        </div>
        <div className="modeToggle" role="group" aria-label="Content mode">
          <button type="button" className={mode === "text" ? "modeButton active" : "modeButton"} aria-pressed={mode === "text"} onClick={() => setMode("text")}><FileText size={20} strokeWidth={1.5} aria-hidden="true" /><span>Text</span></button>
          <button type="button" className={mode === "code" ? "modeButton active" : "modeButton"} aria-pressed={mode === "code"} onClick={() => setMode("code")}><Code2 size={20} strokeWidth={1.5} aria-hidden="true" /><span>Code</span></button>
          <button type="button" className={mode === "photo" ? "modeButton active" : "modeButton"} aria-pressed={mode === "photo"} onClick={() => setMode("photo")}><ImageIcon size={20} strokeWidth={1.5} aria-hidden="true" /><span>Image</span></button>
        </div>
        {mode !== "photo" && <textarea id="composer-content" value={text} onChange={e => { setText(e.target.value); setError(""); }} placeholder={mode === "code" ? "Paste your code snippet…" : "Paste the text you want to share…"} maxLength={100000} aria-label={mode === "code" ? "Code to share" : "Text to share"} />}
        {mode === "code" && <div className="codeSelectRow"><label htmlFor="composer-language">Language</label><select id="composer-language" value={language} onChange={e => setLanguage(e.target.value)}>{CODE_LANGUAGES.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>}
        {mode === "photo" && <div className={dragActive ? "photoComposer dragActive" : "photoComposer"}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)}
          onDrop={e => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0] ?? null); }}
          onPaste={e => { const image = Array.from(e.clipboardData.files).find(item => item.type.startsWith("image/")); if (image) { e.preventDefault(); handleFile(image); } }}>
          {previewUrl ? <div className="photoPreview"><img src={previewUrl} alt="Selected image preview" /><div className="photoPreviewMeta"><span>{file?.name}</span><small>{file ? (file.size / 1024 / 1024).toFixed(2) + " MB" : ""}</small><button className="copy" type="button" onClick={() => { setFile(null); setPreviewUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Remove image</button></div></div> : <div className="photoDrop"><div className="photoDropIcon" aria-hidden="true"><Upload size={22} strokeWidth={1.5} /></div><strong>Drop an image here</strong><span>or choose a photo</span><small>JPG / PNG / GIF / WebP · up to 10 MB</small></div>}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => handleFile(e.target.files?.[0] ?? null)} aria-label="Choose photo" />
          <button className="copy" type="button" onClick={() => fileInputRef.current?.click()}>Choose image</button>
        </div>}
        <div className="lifetimeSection">
          <div className="lifetimeHeader"><span>Link expires in</span><strong>{EXPIRY_OPTIONS.find(o => o.value === expiryMinutes)?.label}</strong></div>
          <div className="lifetimePills" role="group" aria-label="Common link expiry">
            {[{ value: 15, label: "15 min" }, { value: 60, label: "1 hr" }, { value: 1440, label: "24 hr" }, { value: 10080, label: "7 days" }].map(option => <button key={option.value} type="button" aria-pressed={expiryMinutes === option.value} className={expiryMinutes === option.value ? "lifetimePill active" : "lifetimePill"} onClick={() => setExpiryMinutes(option.value)}>{option.label}</button>)}
            <label className="expiryMore"><span className="srOnly">More expiry options</span><select aria-label="More expiry options" value={[15,60,1440,10080].includes(expiryMinutes) ? "" : String(expiryMinutes)} onChange={event => { if (event.target.value) setExpiryMinutes(Number(event.target.value)); }}><option value="">More</option>{EXPIRY_OPTIONS.filter(option => ![15,60,1440,10080].includes(option.value)).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" /></label>
          </div>
        </div>
        <div className="securityBar">
          <button type="button" className={showSecurity ? "securityDisclosure open" : "securityDisclosure"} aria-expanded={showSecurity} onClick={() => setShowSecurity(v => !v)}>
            <span className="securityDot" aria-hidden="true"><LockKeyhole size={16} strokeWidth={1.5} /></span><span><strong>Security options</strong><small>{passwordEnabled ? "Password protection enabled" : viewOnce ? "View once enabled" : "Optional controls"}</small></span><ChevronDown className="securityChevron" size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
          {showSecurity && <div className="securityOptions">
            <div className="optionField accessKeyField"><label className="passwordToggleRow"><input type="checkbox" checked={passwordEnabled} onChange={e => { setPasswordEnabled(e.target.checked); if (!e.target.checked) setAccessKey(""); }} /><span><strong>Password protection</strong><small>Require a password before the share can be opened.</small></span></label>
              {passwordEnabled && <><div className="secretInput"><input type={showAccessKey ? "text" : "password"} value={accessKey} onChange={e => setAccessKey(e.target.value)} maxLength={128} autoComplete="new-password" placeholder="Set a password" aria-label="Share password" aria-describedby="share-password-help" required /><button type="button" className="toggleSecret" aria-label={showAccessKey ? "Hide password" : "Show password"} onClick={() => setShowAccessKey(v => !v)}>{showAccessKey ? "Hide" : "Show"}</button></div><small className="optionNote" id="share-password-help">Recipient must enter this password to view the share.</small></>}
            </div>
            <div><label className="checkField"><input type="checkbox" aria-describedby="view-once-help" checked={viewOnce} onChange={e => setViewOnce(e.target.checked)} /><span><strong>View once</strong><small id="view-once-help">Allow only one successful view.</small></span></label>{viewOnce && <p className="viewOnceWarning" role="status">After the first successful view, this content will no longer be accessible.</p>}</div>
          </div>}
        </div>
        {error && <div className="formError" role="alert">{error}</div>}
        <button className="primary createButton" type="submit" disabled={loading || (mode === "photo" ? !file : !text.trim()) || (passwordEnabled && !accessKey.trim())}>{loading ? <><span className="spinner" /> Creating…</> : <><ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /> Create secure share</>}</button>
        <div className="composerTrust"><LockKeyhole size={15} strokeWidth={1.5} aria-hidden="true" /> No account required. Your content expires automatically.</div>
      </form>
    </section>
  );
}
