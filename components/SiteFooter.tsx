"use client";

import Logo from "@/components/Logo";

export default function SiteFooter() {
  return (
    <footer className="stitchFooter">
      <div className="stitchFooterInner">
        <div className="stitchFooterBrand">
          <Logo className="stitchFooterLogo" />
          <p>Temporary access-controlled sharing for text, code, and photos.</p>
          <span className="stitchFooterPill"><i aria-hidden="true" /> No account required</span>
        </div>
        <div className="stitchFooterColumn">
          <h2>PRODUCT</h2>
          <a href="/">Home</a>
          <a href="/how-it-works">How it works</a>
          <a href="/recent">Recent shares</a>
          <a href="/create">Create a share</a>
        </div>
        <div className="stitchFooterColumn">
          <h2>GOVERNANCE</h2>
          <a href="/about">About</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
        <div className="stitchFooterColumn">
          <h2>SUPPORT</h2>
          <a href="/contact">Contact</a>
          <a href="/report-abuse">Report abuse</a>
        </div>
      </div>
      <div className="stitchFooterBottom">
        <span>© 2026 Moog</span>
        <span>Moog controls access, not copies.</span>
      </div>
    </footer>
  );
}
