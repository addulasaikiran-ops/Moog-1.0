"use client";

import { FormEvent, useMemo, useState } from "react";
import Logo from "@/components/Logo";

type Lifetime = "15" | "60" | "1440" | "10080" | "custom";
type RecentShare = { type: "text" | "code" | "photo"; createdAt: string; expiresAt: string; url: string; code: string; passwordProtected: boolean; viewOnce: boolean; revoked?: boolean; viewed?: boolean };
const lifetimeOptions: { value: Lifetime; label: string }[] = [
  { value: "15", label: "15 minutes" },
  { value: "60", label: "1 hour" },
  { value: "1440", label: "1 day" },
  { value: "10080", label: "7 days" },
  { value: "custom", label: "Custom" },
];

export default function CreateSharePage() {
  const [text, setText] = useState("");
  const [lifetime, setLifetime] = useState<Lifetime>("1440");
  const [customExpiry, setCustomExpiry] = useState("");
  const [protect, setProtect] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [viewOnce, setViewOnce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{url:string; code:string; expiresAt:string; revokeToken:string} | null>(null);
  const [copied, setCopied] = useState(false);

  const customMinutes = useMemo(() => {
    if (!customExpiry) return 0;
    const date = new Date(customExpiry).getTime();
    return Math.ceil((date - Date.now()) / 60000);
  }, [customExpiry]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!text.trim()) { setError("Add a message before creating your link."); return; }
    if (protect && !accessKey.trim()) { setError("Enter a password or turn off password protection."); return; }
    const expiryMinutes = lifetime === "custom" ? customMinutes : Number(lifetime);
    if (!Number.isInteger(expiryMinutes) || expiryMinutes < 1 || expiryMinutes > 10080) {
      setError("Choose an expiry between now and seven days from now."); return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: "text", expiryMinutes, password: protect ? accessKey : "", viewOnce }),
      });
      const body = await response.json() as { url?: string; code?: string; expiresAt?: string; revokeToken?: string; error?: string };
      if (!response.ok || !body.url || !body.code || !body.expiresAt || !body.revokeToken) throw new Error(body.error ?? "Could not create your secure link.");
      const nextResult = { url: body.url, code: body.code, expiresAt: body.expiresAt, revokeToken: body.revokeToken };
      setResult(nextResult);
      try {
        const key = "moog-recent-shares-v1";
        const previous = JSON.parse(window.localStorage.getItem(key) ?? "[]") as RecentShare[];
        const entry: RecentShare = { type: "text", createdAt: new Date().toISOString(), expiresAt: body.expiresAt, url: body.url, code: body.code, passwordProtected: protect, viewOnce };
        window.localStorage.setItem(key, JSON.stringify([entry, ...previous.filter((item) => item.url !== body.url)].slice(0, 30)));
      } catch {
        // The share is already created; local history is a convenience, not a dependency.
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create your secure link.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.url); setCopied(true); window.setTimeout(() => setCopied(false), 2200); }
    catch { setError("Copy wasn’t available. Select and copy the link manually."); }
  }

  if (result) {
    const minutesLeft = Math.max(1, Math.ceil((new Date(result.expiresAt).getTime() - Date.now()) / 60000));
    const expiryLabel = minutesLeft < 60 ? minutesLeft + (minutesLeft === 1 ? " minute" : " minutes") : minutesLeft < 1440 ? Math.ceil(minutesLeft / 60) + (Math.ceil(minutesLeft / 60) === 1 ? " hour" : " hours") : Math.ceil(minutesLeft / 1440) + (Math.ceil(minutesLeft / 1440) === 1 ? " day" : " days");
    return <main className="createShareSuccessPage">
      <header className="createShareTopbar"><Logo className="createShareLogo" /><nav><a href="/how-it-works">How it works</a></nav></header>
      <div className="createShareSuccessWrap">
        <section className="createShareSuccessCard" aria-live="polite">
          <div className="createShareSuccessMark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="m13 24 7.5 7.5L35 17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
          <h1>Your share is ready</h1><p className="createShareSuccessSubtitle">Keep this link private and share it securely.</p>
          <div className="createShareUrlBox"><div className="createShareUrlText" title={result.url}>{result.url}</div><button type="button" onClick={copyLink} className={copied ? "createShareCopyIcon copied" : "createShareCopyIcon"} aria-label={copied ? "Link copied" : "Copy link"}>{copied ? "✓" : "▢"}</button></div>
          <div className="createShareDetails">
            <p><span aria-hidden="true">◷</span> Expires in {expiryLabel} <span className="createShareDetailExact">· {new Date(result.expiresAt).toLocaleString()}</span></p>
            {protect && <p><span aria-hidden="true">♢</span> Password protected</p>}
            {viewOnce && <p><span aria-hidden="true">◎</span> One-time view only</p>}
          </div>
          <div className="createShareSuccessActions"><button type="button" className="createSharePrimary" onClick={copyLink}>{copied ? "✓ Copied!" : "▢ Copy link"}</button><a className="createShareEmailButton" href={"mailto:?subject="+encodeURIComponent("A secure link shared with you")+"&body="+encodeURIComponent("Here is your secure link: "+result.url+(protect ? "\n\nA password is required to open this share. I will send it to you separately." : ""))}>Share via email ↗</a></div>
          <div className="createShareSuccessFooter"><a href="/create" onClick={e => {e.preventDefault(); setResult(null); setText(""); setLifetime("1440"); setCustomExpiry(""); setProtect(false); setAccessKey(""); setViewOnce(false); setError(""); setCopied(false); window.scrollTo({top:0,behavior:"smooth"});}}>⟲ Create another share</a><a href="/recent">→ Go to my shares</a></div>
          <div className="createShareSuccessCode"><span>6-DIGIT SHARE CODE</span><strong>{result.code.replace(/(\\d{3})(\\d{3})/, "$1 $2")}</strong><p>Share this code separately if the recipient will use the receive form.</p></div>
        </section>
      </div>
    </main>;
  }

  return <main className="createSharePage">
    <header className="createShareTopbar">
      <Logo className="createShareLogo" />
      <nav><a href="/how-it-works">How it works</a><a className="createShareGetStarted" href="/create">Get started</a></nav>
    </header>
    <div className="createShareShell">
      <a className="createShareBack" href="/">← <span>Back</span></a>
      <div className="createShareHeading"><h1>Create secure share</h1><p>Paste your content below and configure how you want to share it.</p></div>
      <form className="createShareGrid" onSubmit={submit}>
        <section className="createShareEditorColumn" aria-label="Message content">
          <div className="createShareEditorCard">
            <div className="createShareEditorWrap">
              <textarea value={text} onChange={e => setText(e.target.value)} maxLength={100000} placeholder="Paste your private message, note, or snippet here…" aria-label="Private message" />
              <div className="createShareCounter"><span aria-hidden="true">♙</span><span>{text.length.toLocaleString()} / 100,000 characters</span></div>
            </div>
            <p className="createShareEncryption"><span aria-hidden="true">⬟</span> Sent over HTTPS. Not end-to-end encrypted. The server can technically read active share content.</p>
          </div>
        </section>
        <aside className="createShareSettings">
          <h2><span aria-hidden="true">◷</span> Share settings</h2>
          <section className="createShareSettingCard">
            <h3><span aria-hidden="true">◷</span> Link lifetime</h3>
            <div className="createShareLifetimeList">
              {lifetimeOptions.map(option => <label key={option.value} className="createShareRadio"><input type="radio" name="lifetime" value={option.value} checked={lifetime === option.value} onChange={() => setLifetime(option.value)} /><span>{option.label}</span></label>)}
            </div>
            {lifetime === "custom" && <label className="createShareCustomExpiry">Expiry date and time<input type="datetime-local" min={new Date(Date.now()+60000).toISOString().slice(0,16)} max={new Date(Date.now()+7*24*60*60*1000).toISOString().slice(0,16)} value={customExpiry} onChange={e => setCustomExpiry(e.target.value)} /></label>}
            <p className="createShareHint"><span aria-hidden="true">●</span> The link will be inactive after this time.</p>
          </section>
          <section className="createShareSettingCard">
            <h3><span aria-hidden="true">♢</span> Access control</h3>
            <div className="createShareToggleRow">
              <button type="button" role="switch" aria-checked={protect} className={protect ? "createShareSwitch on" : "createShareSwitch"} onClick={() => setProtect(!protect)}><span /></button>
              <div className="createShareToggleCopy"><strong>Password protection</strong><p>Require a password to view your content.</p></div>
            </div>
            {protect && <label className="createShareAccessInput">Password<div><input type={showKey ? "text" : "password"} autoComplete="new-password" maxLength={128} value={accessKey} onChange={e => setAccessKey(e.target.value)} placeholder="Enter a password" /><button type="button" onClick={() => setShowKey(!showKey)} aria-label={showKey ? "Hide password" : "Show password"}>{showKey ? "Hide" : "Show"}</button></div></label>}
            <div className="createShareToggleRow">
              <button type="button" role="switch" aria-checked={viewOnce} className={viewOnce ? "createShareSwitch on" : "createShareSwitch"} onClick={() => setViewOnce(!viewOnce)}><span /></button>
              <div className="createShareToggleCopy"><strong>One-time view only</strong><p>Content becomes unavailable after its first successful view.</p></div>
            </div>
          </section>
          <section className="createShareSettingCard">
            <h3><span aria-hidden="true">⚙</span> Additional options</h3>
            <p className="createShareNote">Shares are private by default. Browser controls may still allow copying; these options do not prevent screenshots.</p>
          </section>
          {error && <p className="createShareError" role="alert">{error}</p>}<div className="createShareFormActions"><button className="createSharePrimary" type="submit" disabled={loading}>{loading ? "Creating secure link…" : <><span aria-hidden="true">↗</span> Create secure link</>}</button><a href="/">Cancel</a></div>
        </aside>
      </form>
    </div>
  </main>;
}
