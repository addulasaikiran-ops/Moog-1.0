"use client";

import Logo from "@/components/Logo";

export default function SiteFooter() {
  return (
    <footer className="stitchFooter">
      <div className="stitchFooterInner">
        <div className="stitchFooterBrand">
          <Logo className="stitchFooterLogo" />
          <p>Temporary access-controlled sharing for text, code, and images.</p>
          <span className="stitchFooterPill"><i aria-hidden="true" /> No account required</span>
        </div>
        <div className="stitchFooterColumn">
          <h2>EXPLORE</h2>
          <a href="/#about-moog">About</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/recent">Recent shares</a>
          <a href="/privacy">Privacy</a>
        </div>
        <div className="stitchFooterColumn">
          <h2>LEGAL</h2>
          <a href="/terms">Terms</a>
          <a href="/report-abuse">Report abuse</a>
          <a href="/contact">Contact</a>
        </div>
      </div>
      <div className="stitchFooterBottom">
        <span>© 2026 Moog</span>
        <span>Moog controls access, not copies.</span>
      </div>
    </footer>
  );
}
