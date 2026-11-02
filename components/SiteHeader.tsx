"use client";

import Logo from "@/components/Logo";

type ActivePage = "home" | "how" | "recent" | "privacy" | "create" | "about" | "terms" | "contact" | "report";

const links: Array<{ href: string; label: string; key: ActivePage }> = [
  { href: "/", label: "Home", key: "home" },
  { href: "/#share", label: "Share", key: "create" },
  { href: "/#about-moog", label: "About", key: "about" },
  { href: "/#how-it-works", label: "How it works", key: "how" },
];

export default function SiteHeader({ active }: { active?: ActivePage }) {
  return (
    <header className="stitchHeader">
      <div className="stitchHeaderInner">
        <Logo className="stitchLogo" />
        <nav className="stitchDesktopNav" aria-label="Primary navigation">
          {links.map((item) => (
            <a key={item.key} href={item.href} aria-current={active === item.key ? "page" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="stitchHeaderActions">
          <a className="stitchHeaderCta" href="/#share">
            <span className="stitchLiveDot" aria-hidden="true" />
            Create a share <span aria-hidden="true">→</span>
          </a>
          <details className="stitchMobileMenu">
            <summary aria-label="Open navigation">
              <span className="stitchMenuGlyph" aria-hidden="true"><i /><i /><i /></span>
            </summary>
            <nav aria-label="Mobile navigation">
              {links.map((item) => (
                <a key={item.key} href={item.href} aria-current={active === item.key ? "page" : undefined}>
                  {item.label}
                </a>
              ))}
              <a href="/#share">Create a share →</a>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/report-abuse">Report abuse</a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
