"use client";

import { FormEvent, useState } from "react";

type Expiry = 15 | 60;

export default function HomePage() {
  const [text, setText] = useState("");
  const [expiry, setExpiry] = useState<Expiry>(60);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setUrl("");
    if (!text.trim()) { setError("Write something first."); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/shares", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, expiryMinutes: expiry }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not create link.");
      setUrl(data.url ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }

  async function copyLink() {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); } catch {}
  }

  const expiryLabel = expiry === 15 ? "15 minutes" : "1 hour";

  return (
    <main className="home">
      <div className="ambient ambientOne" /><div className="ambient ambientTwo" />
      <div className="shell">
        <header className="topbar">
          <div className="logo"><span className="logoMark">M</span><span>Moog</span></div>
          <div className="badge"><span className="pulse" /> private by default</div>
        </header>

        <section className="hero">
          <div className="eyebrow">TEMPORARY TEXT SHARING</div>
          <h1>Share words.<br /><span>Leave no trail.</span></h1>
          <p className="heroCopy">Drop in any text, get a private link, and choose exactly how long it should stay alive.</p>
        </section>

        <section className="composer card">
          <form onSubmit={handleSubmit}>
            <div className="composerTop">
              <div className="fieldLabel">YOUR MESSAGE</div>
              <div className="counter">{text.length.toLocaleString()} / 100,000</div>
            </div>
            <textarea value={text} onChange={(event) => setText(event.target.value)}
              placeholder="Type or paste something to share…" maxLength={100000}
              aria-label="Text to share" autoFocus />

            <div className="expiryPicker">
              <div>
                <div className="fieldLabel">LINK EXPIRY</div>
                <div className="expiryHint">The link disappears after this time.</div>
              </div>
              <div className="expiryOptions" role="group" aria-label="Link expiry">
                <button type="button" className={expiry === 15 ? "expiryOption active" : "expiryOption"}
                  onClick={() => setExpiry(15)} aria-pressed={expiry === 15}>15 min</button>
                <button type="button" className={expiry === 60 ? "expiryOption active" : "expiryOption"}
                  onClick={() => setExpiry(60)} aria-pressed={expiry === 60}>1 hour</button>
              </div>
            </div>

            <div className="composerBottom">
              <div className="trust"><span>⌁</span><span>No account · no tracking · expires in {expiryLabel}</span></div>
              <button className="primary" type="submit" disabled={loading || !text.trim()}>
                {loading ? <><span className="spinner" /> Creating…</> : <>Create private link <span>↗</span></>}
              </button>
            </div>
          </form>
          {error ? <p className="error">{error}</p> : null}
          {url ? (
            <div className="result">
              <div><div className="resultLabel">YOUR LINK IS READY · EXPIRES IN {expiryLabel.toUpperCase()}</div>
                <a href={url} target="_blank" rel="noreferrer">{url}</a></div>
              <button className="copy" type="button" onClick={copyLink}>Copy link</button>
            </div>
          ) : null}
        </section>

        <div className="features">
          <div><span>01</span><strong>Write</strong><small>Paste your text</small></div>
          <div><span>02</span><strong>Share</strong><small>Send the private link</small></div>
          <div><span>03</span><strong>Vanish</strong><small>Gone when the timer ends</small></div>
        </div>
        <footer>Moog <span>·</span> Temporary text, intentionally temporary.</footer>
      </div>
    </main>
  );
}
