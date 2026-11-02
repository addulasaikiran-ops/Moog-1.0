"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, ArrowUpRight, ChevronDown, Clock3, Code2, Eye, FileText, Image as ImageIcon, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Composer, { type CreatedShare } from "@/components/Composer";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareResult from "@/components/ShareResult";

type Tab = "send" | "receive";
const COMMON_EXPIRY_LABELS: Record<number, string> = {
  1: "1 minute", 5: "5 minutes", 15: "15 minutes", 30: "30 minutes",
  60: "1 hour", 360: "6 hours", 1440: "24 hours", 4320: "3 days", 10080: "7 days",
};
function formatReceiveCode(value: string) { return value.replace(/\\D/g, "").slice(0, 6); }
function isValidCode(value: string) { return /^\\d{6}$/.test(value); }

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("send");
  const [createdShare, setCreatedShare] = useState<CreatedShare | null>(null);
  const [receiveCode, setReceiveCode] = useState("");
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveError, setReceiveError] = useState("");
  const [previewExpiryMinutes, setPreviewExpiryMinutes] = useState(1440);
  const [visualSeconds, setVisualSeconds] = useState(8);
  const [previewExpired, setPreviewExpired] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const receiveInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("tab") === "receive") setTab("receive");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setVisualSeconds(8);
      setPreviewExpired(false);
      return;
    }
    let seconds = 8;
    let expiredTicks = 0;
    const interval = window.setInterval(() => {
      if (seconds > 0) {
        seconds -= 1;
        setVisualSeconds(seconds);
        if (seconds === 0) {
          setPreviewExpired(true);
          expiredTicks = 2;
        }
      } else if (expiredTicks > 0) {
        expiredTicks -= 1;
        if (expiredTicks === 0) {
          seconds = 8;
          setVisualSeconds(seconds);
          setPreviewExpired(false);
        }
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  function changeTab(next: Tab) {
    setTab(next);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", next);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    setReceiveError("");
  }

  async function receiveShare(event: FormEvent) {
    event.preventDefault();
    setReceiveError("");
    const normalized = formatReceiveCode(receiveCode);
    if (!isValidCode(normalized)) { setReceiveError("Enter the 6-digit share code."); return; }
    setReceiveLoading(true);
    try {
      const response = await fetch("/api/receive", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      const body = (await response.json()) as { token?: string; error?: string; reason?: string };
      if (!response.ok || !body.token) {
        const message = body.reason === "expired" ? "This share has expired" : response.status === 429 ? "Too many attempts. Try again in a few minutes." : "That code didn't work";
        throw new Error(message);
      }
      window.location.assign(`/s/${body.token}`);
    } catch (error) {
      setReceiveError(error instanceof Error ? error.message : "Share unavailable.");
    } finally { setReceiveLoading(false); }
  }

  const expiryLabel = COMMON_EXPIRY_LABELS[previewExpiryMinutes] ?? "24 hours";

  return (
    <main className="page restylePage">
      <div className="shell">
        <SiteHeader active="home" />
        <section className="moogHero restyleHero" aria-labelledby="hero-title">
          <div className="restyleHeroCopy">
            <h1 id="hero-title">Share it.<br />Let it disappear.</h1>
            <p className="moogHeroCopy">Send a note, code snippet, or image with an expiry you choose. No account to create. No old link to clean up.</p>
            <div className="moogHeroActions">
              <a className="moogPrimary" href="#composer">Create a private share <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></a>
              <button className="moogSecondary" type="button" onClick={() => { changeTab("receive"); document.getElementById("composer")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }); }}>Receive a share</button>
            </div>
            <p className="heroQuietNote"><LockKeyhole size={16} strokeWidth={1.5} aria-hidden="true" /> No account required. Choose an expiry and optional access controls.</p>
          </div>
          <div className="expiryArtifact" data-ui="share-preview" aria-label="Illustrative share preview">
            <div className="artifactTop"><span className="artifactStatus"><span className={previewExpired ? "artifactStatusDot expired" : "artifactStatusDot"} />{previewExpired ? "Expired" : "Active preview"}</span><span className="artifactSample">SAMPLE SHARE</span></div>
            <div className="artifactDocument">
              <div className="artifactFileIcon"><FileText size={20} strokeWidth={1.5} aria-hidden="true" /></div>
              <div className="artifactDocumentTitle"><strong>Project notes</strong><span>Text share · Private link</span></div>
              <span className="artifactExpiryBadge"><Clock3 size={14} strokeWidth={1.5} aria-hidden="true" /> Expires in {expiryLabel}</span>
              <div className="artifactTextLines" aria-hidden="true"><span /><span /><span /><span /></div>
              <div className={previewExpired ? "artifactCountdown isExpired" : "artifactCountdown"} aria-live="off">
                <span className="artifactCountdownLabel">{previewExpired ? "Access ended" : "Preview countdown"}</span>
                <strong>{previewExpired ? "Expired" : `00:00:0${visualSeconds}`}</strong>
              </div>
            </div>
            <div className="artifactBottom"><span><LockKeyhole size={14} strokeWidth={1.5} aria-hidden="true" /> Access controlled</span><span>Illustrative preview</span></div>
          </div>
        </section>

        <section className="composerExperience" id="composer" aria-label="Create or receive a share">
          <div className="composerExperienceHeading"><div><h2>Make a share</h2><p>Choose what to send and when access should end.</p></div><span className="composerNoAccount"><ShieldCheck size={16} strokeWidth={1.5} aria-hidden="true" /> No account</span></div>
          <div className="referenceComposerTabs" role="tablist" aria-label="Send or receive">
            <button type="button" role="tab" aria-selected={tab === "send"} className={tab === "send" ? "referenceComposerTab active" : "referenceComposerTab"} onClick={() => changeTab("send")}><ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /> Send</button>
            <button type="button" role="tab" aria-selected={tab === "receive"} className={tab === "receive" ? "referenceComposerTab active" : "referenceComposerTab"} onClick={() => changeTab("receive")}><ArrowDownToLine size={18} strokeWidth={1.5} aria-hidden="true" /> Receive</button>
          </div>
          {tab === "send" ? (
            <>
              <Composer onExpiryChange={setPreviewExpiryMinutes} onCreated={share => { setCreatedShare(share); setTab("send"); }} />
              {createdShare && <ShareResult share={createdShare} onCreateAnother={() => { setCreatedShare(null); document.getElementById("composer")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }); }} />}
            </>
          ) : (
            <section className="receiveCard card" id="receive-panel" aria-labelledby="receive-title" data-ui="receive-form">
              <div className="receiveHeader"><span className="receiveGlyph" aria-hidden="true"><ArrowDownToLine size={20} strokeWidth={1.5} /></span><div><h2 id="receive-title">Receive a share</h2><p>Enter the six-digit code you received to open the share. No account needed.</p></div></div>
              <form onSubmit={receiveShare}>
                <label className="receiveLabel" htmlFor="receive-code-1">Six-digit share code</label>
                <div className="receiveCodeBoxes" role="group" aria-label="Six-digit share code" onPaste={event => {
                  const pasted = formatReceiveCode(event.clipboardData.getData("text"));
                  if (pasted) { event.preventDefault(); setReceiveCode(pasted); setReceiveError(""); receiveInputRefs.current[Math.min(pasted.length, 5)]?.focus(); }
                }}>
                  {Array.from({ length: 6 }, (_, index) => <input key={index} id={index === 0 ? "receive-code-1" : undefined} ref={node => { receiveInputRefs.current[index] = node; }} className="receiveDigit" aria-label={`Share code digit ${index + 1}`} aria-describedby="receive-help" value={receiveCode[index] ?? ""} inputMode="numeric" pattern="[0-9]*" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={6} onChange={event => {
                    const entered = formatReceiveCode(event.target.value);
                    if (entered.length > 1) {
                      setReceiveCode(entered); setReceiveError("");
                      receiveInputRefs.current[Math.min(entered.length, 5)]?.focus(); return;
                    }
                    const digit = entered.slice(-1);
                    const next = (receiveCode.slice(0, index) + digit + receiveCode.slice(index + 1)).slice(0, 6);
                    setReceiveCode(next); setReceiveError("");
                    if (digit && index < 5) receiveInputRefs.current[index + 1]?.focus();
                  }} onKeyDown={event => {
                    if (event.key === "Backspace" && !receiveCode[index] && index > 0) receiveInputRefs.current[index - 1]?.focus();
                    if (event.key === "ArrowLeft" && index > 0) receiveInputRefs.current[index - 1]?.focus();
                    if (event.key === "ArrowRight" && index < 5) receiveInputRefs.current[index + 1]?.focus();
                  }} />)}
                </div>
                <p id="receive-help" className="receiveHint">If the share is protected, you’ll also enter its password.</p>
                {receiveError && <p className="receiveError" role="alert" aria-live="assertive">{receiveError}</p>}
                <button className="receiveOpen primary" type="submit" disabled={receiveCode.length !== 6 || receiveLoading}>{receiveLoading ? <><span className="spinner" /> Opening share…</> : <>Open share <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" /></>}</button>
              </form>
              <p className="receiveNote"><LockKeyhole size={15} strokeWidth={1.5} aria-hidden="true" /> Password-protected shares ask for the password when opened. View-once shares are consumed after the first successful reveal.</p>
            </section>
          )}
        </section>

        <section className="useMoog restyleUseCases" id="about-moog" aria-labelledby="use-title">
          <div className="useIntro"><h2 id="use-title">A short life for the things you share.</h2><p>Moog gives text, code, and images a chosen lifetime, with optional access controls and no account to create.</p><img className="moogBots" src="/moog-bots.svg" alt="Moog bots pass a small private share between one another." loading="lazy" /></div>
          <div className="useGrid">
            <article className="useCase useCaseSecret"><h3><span className="useCaseIcon"><KeyRound size={20} strokeWidth={1.5} aria-hidden="true" /></span>Sensitive information</h3><p>Share passwords, API keys or other secrets.</p></article>
            <article className="useCase useCaseCode"><h3><span className="useCaseIcon"><Code2 size={20} strokeWidth={1.5} aria-hidden="true" /></span>Code snippets</h3><p>Send code to a teammate without leaving it forever.</p><pre data-ui="code-fragment"><code>const share = await moog.create();</code></pre></article>
            <article className="useCase useCaseNotes"><h3><span className="useCaseIcon"><FileText size={20} strokeWidth={1.5} aria-hidden="true" /></span>Temporary notes</h3><p>Share text between devices without an account.</p></article>
            <article className="useCase useCaseImage"><h3><span className="useCaseIcon"><ImageIcon size={20} strokeWidth={1.5} aria-hidden="true" /></span>Private images</h3><p>Share screenshots or photos that shouldn’t stay online.</p><div className="imageFragment" data-ui="image-fragment"><ImageIcon size={30} strokeWidth={1.5} aria-hidden="true" /><span>Image share · JPG / PNG / WebP</span></div></article>
          </div>
        </section>

        <section className="howMoog restyleHow" id="how-it-works" aria-labelledby="how-title">
          <div className="howIntro"><h2 id="how-title">How it works</h2><p>Create a share, send it along, and let its expiry handle the rest.</p></div>
          <ol className="howSteps">
            <li><span className="stepIcon"><FileText size={20} strokeWidth={1.5} aria-hidden="true" /></span><h3>Create</h3><p>Paste text, code, or an image and choose an expiry time.</p></li>
            <li><span className="stepIcon"><Clock3 size={20} strokeWidth={1.5} aria-hidden="true" /></span><h3>Share</h3><p>Get a private link and send it to anyone.</p></li>
            <li><span className="stepIcon"><ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true" /></span><h3>Open</h3><p>They open it without an account.</p></li>
            <li><span className="stepIcon"><Eye size={20} strokeWidth={1.5} aria-hidden="true" /></span><h3>Expire</h3><p>Access disappears automatically.</p></li>
          </ol>
        </section>

        <section className="securityReference restylePrivacy" id="security" aria-labelledby="security-title">
          <div className="privacyLead"><span className="privacyIcon"><ShieldCheck size={22} strokeWidth={1.5} aria-hidden="true" /></span><h2 id="security-title">Built with privacy in mind.</h2><p>Here’s what you need to know.</p><p>Moog stores shared content on the server so it can deliver the share. It is access-controlled, not end-to-end encrypted.</p></div>
          <div className="securityGrid">
            <article><LockKeyhole size={20} strokeWidth={1.5} aria-hidden="true" /><h3>Private links</h3><p>High-entropy links that are difficult to guess.</p></article>
            <article><KeyRound size={20} strokeWidth={1.5} aria-hidden="true" /><h3>Secure storage</h3><p>Links and codes are stored as hashes.</p></article>
            <article><ShieldCheck size={20} strokeWidth={1.5} aria-hidden="true" /><h3>We control access, not copies</h3><p>Once someone views or downloads the content, we can't prevent them from copying it.</p></article>
            <article><Eye size={20} strokeWidth={1.5} aria-hidden="true" /><h3>No tracking</h3><p>Moog doesn’t require an account and doesn’t use third-party analytics tracking.</p></article>
          </div>
        </section>

        <section className="faqArea restyleFaq" id="faq" aria-labelledby="faq-title">
          <div className="faq"><h2 id="faq-title">Frequently asked questions</h2>
            {[
              ["Is my share end-to-end encrypted?", "Not yet. Moog currently protects access to server-stored content, but the server can technically read active share content. Treat it as temporary access control, not zero-knowledge encryption."],
              ["Do I need an account?", "No. Sending and receiving are both account-free."],
              ["How long do shares stay alive?", "Choose from 1 minute to 7 days when you create a share."],
              ["Can someone copy what I shared?", "Yes. Moog controls access, not copies. Screenshots and copied content cannot be taken back."],
              ["What can I share?", "Text, supported code formats, and JPG, PNG, GIF, or WebP photos up to 10 MB."],
            ].map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18} strokeWidth={1.5} aria-hidden="true" /></summary><p>{answer}</p></details>)}
          </div>
          <aside className="contactCard"><div className="contactIcon" aria-hidden="true"><Mail size={20} strokeWidth={1.5} /></div><h3>Still have questions?</h3><p>If you need more information, get in touch.</p><a href="/contact">Contact us <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></a></aside>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
