"use client";

import { FormEvent, useRef, useState } from "react";
import Composer, { type CreatedShare } from "@/components/Composer";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ShareResult from "@/components/ShareResult";
import { ArrowUpRight, Clock3, FileText, LockKeyhole, ShieldCheck } from "lucide-react";

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
function formatReceiveCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

function isValidCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("send");
  const [createdShare, setCreatedShare] = useState<CreatedShare | null>(null);
  const [receiveCode, setReceiveCode] = useState("");
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveError, setReceiveError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const receiveInputRefs = useRef<Array<HTMLInputElement | null>>([]);

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
        <SiteHeader active="home" />

        <section className="moogHero" aria-labelledby="hero-title">
          <div className="moogHeroContent">
            <p className="moogEyebrow">TEMPORARY SHARING</p>
            <h1 id="hero-title">Share it.<br />Let it disappear.</h1>
            <p className="moogHeroCopy">Send text, code, or an image with an expiry you choose. No account to create.</p>
            <div className="moogHeroActions">
              <a className="moogPrimary" href="#composer">Create a private share <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></a>
              <button className="moogSecondary" type="button" onClick={() => { changeTab("receive"); document.getElementById("receive-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Receive a share</button>
            </div>
            <div className="moogTrust" aria-label="Moog features">
              <div><LockKeyhole size={16} strokeWidth={1.5} aria-hidden="true" /><span>No account</span></div>
              <div><Clock3 size={16} strokeWidth={1.5} aria-hidden="true" /><span>Choose expiry</span></div>
              <div><ShieldCheck size={16} strokeWidth={1.5} aria-hidden="true" /><span>Access controls</span></div>
            </div>
          </div>
          <aside className="moogLivePreview" aria-label="Sample share preview">
            <div className="moogPreviewTop"><span>SHARE PREVIEW</span><span className="moogPreviewExpiry"><Clock3 size={13} strokeWidth={1.5} aria-hidden="true" /> Expires in 24 hours</span></div>
            <div className="moogPreviewPaper">
              <div className="moogPreviewFile"><span className="moogPreviewFileIcon"><FileText size={20} strokeWidth={1.5} aria-hidden="true" /></span><span><strong>Project notes</strong><small>Text share · Sample artifact</small></span></div>
              <div className="moogPreviewContent"><span>Things to send over</span><span>01&nbsp; Updated project brief</span><span>02&nbsp; Review the latest draft</span><span>03&nbsp; Share feedback by Friday</span></div>
            </div>
            <div className="moogPreviewFooter"><span><span className="moogPreviewStatusDot" /> Access controlled</span><span>Sample only</span></div>
          </aside>
        </section>
        <div className="referenceComposerTabs" role="tablist" aria-label="Send or receive">
          <button type="button" role="tab" aria-selected={tab === "send"} className={tab === "send" ? "referenceComposerTab active" : "referenceComposerTab"} onClick={() => changeTab("send")}>Send</button>
          <button type="button" role="tab" aria-selected={tab === "receive"} className={tab === "receive" ? "referenceComposerTab active" : "referenceComposerTab"} onClick={() => changeTab("receive")}>Receive</button>
        </div>
        {tab === "send" ? (
          <>
            <Composer onCreated={(share) => { setCreatedShare(share); setTab("send"); }} />
            {createdShare && <ShareResult share={createdShare} onCreateAnother={() => { setCreatedShare(null); document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />}
          </>
        ) : (
          <section className="receiveCard card" id="receive-panel" aria-labelledby="receive-title">
            <div className="receiveHeader"><span className="receiveGlyph" aria-hidden="true">↓</span><div><h2 id="receive-title">Receive</h2><p>Got a code from someone? Paste it here to open what they shared. No account needed.</p></div></div>
            <form onSubmit={receiveShare}>
              <div className="receiveLabel">Unique code</div>
              <div className="receiveCodeBoxes" role="group" aria-labelledby="receive-code-label" onPaste={(event) => { const pasted = formatReceiveCode(event.clipboardData.getData("text")); if (pasted) { event.preventDefault(); setReceiveCode(pasted); setReceiveError(""); receiveInputRefs.current[Math.min(pasted.length, 5)]?.focus(); } }}><span id="receive-code-label" className="srOnly">Six-digit share code</span>{Array.from({ length: 6 }, (_, index) => <input key={index} ref={(node) => { receiveInputRefs.current[index] = node; }} className="receiveDigit" aria-label={`Share code digit ${index + 1}`} value={receiveCode[index] ?? ""} inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={1} onChange={(event) => { const digit = event.target.value.replace(/\D/g, "").slice(-1); const next = (receiveCode.slice(0, index) + digit + receiveCode.slice(index + 1)).slice(0, 6); setReceiveCode(next); setReceiveError(""); if (digit && index < 5) receiveInputRefs.current[index + 1]?.focus(); }} onKeyDown={(event) => { if (event.key === "Backspace" && !receiveCode[index] && index > 0) receiveInputRefs.current[index - 1]?.focus(); if (event.key === "ArrowLeft" && index > 0) receiveInputRefs.current[index - 1]?.focus(); if (event.key === "ArrowRight" && index < 5) receiveInputRefs.current[index + 1]?.focus(); }} />)}</div>
              <p id="receive-help" className="receiveHint">Six numbers. If the share is protected, you’ll also enter its password.</p>
              {receiveError ? <p className="receiveError" role="alert">{receiveError}</p> : null}
              <button className="receiveOpen primary" type="submit" disabled={receiveCode.length !== 6 || receiveLoading}>{receiveLoading ? <><span className="spinner" /> Opening share…</> : <>Open share <span>→</span></>}</button>
            </form>
            <div className="receiveNote"><span aria-hidden="true">⌁</span><span>Password-protected shares ask for the password when opened. View-once shares are consumed after the first successful reveal.</span></div>
          </section>
        )}


        <section className="useMoog" id="about-moog" aria-labelledby="use-title">
          <div className="useIntro"><div className="eyebrow">ABOUT MOOG</div><h2 id="use-title">A short life for the things you share.</h2><p>Moog gives text, code, and images a chosen lifetime, with optional access controls and no account to create.</p></div>
          <div className="useGrid">
            <div><i className="usePink">▣</i><strong>Sensitive information</strong><small>Share passwords, API keys or other secrets.</small></div>
            <div><i className="useBlue">&lt;/&gt;</i><strong>Code snippets</strong><small>Send code to a teammate without leaving it forever.</small></div>
            <div><i className="useGreen">▤</i><strong>Temporary notes</strong><small>Share text between devices without an account.</small></div>
            <div><i className="useOrange">▧</i><strong>Private images</strong><small>Share screenshots or photos that shouldn&apos;t stay online.</small></div>
          </div>
        </section>

                <section className="productFeatures" aria-label="Moog benefits">
          <div className="featureCard featurePurple"><i>◷</i><strong>Temporary by design</strong><small>Your content expires automatically, based on the lifetime you choose.</small></div>
          <div className="featureCard featureBlue"><i>⌑</i><strong>Protected access</strong><small>Optional password protection and view-once access help control who can open a share.</small></div>
          
          <div className="featureCard featureOrange"><i>◉</i><strong>No account needed</strong><small>Create a share and send it instantly without signing up.</small></div>
        </section>

        <section className="howMoog referenceHow" id="how-it-works" aria-labelledby="how-title">
          <div className="howIntro"><div className="eyebrow">HOW IT WORKS</div><h2 id="how-title">How it works</h2><p>Create a share, send it along, and let its expiry handle the rest.</p></div>
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
        <SiteFooter />
      </div>
    </main>
  );
}
