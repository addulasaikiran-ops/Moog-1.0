"use client";

import { ArrowUpRight } from "lucide-react";
import Logo from "@/components/Logo";

const footerLinks = [
  { href: "/#about-moog", label: "About" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/recent", label: "Recent shares" },
  { href: "/privacy", label: "Privacy" },
];

export default function SiteFooter() {
  return (
    <footer className="stitchFooter restyleFooter">
      <div className="restyleFooterBrand">
        <Logo className="stitchFooterLogo" />
        <p>Give a share a lifetime. Let access end when it should.</p>
        <a className="footerCreateLink" href="/create">Create a private share <ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></a>
      </div>
      <div className="restyleFooterBottom">
        <nav aria-label="Footer navigation">
          {footerLinks.map(link => <a href={link.href} key={link.label}>{link.label}</a>)}
        </nav>
        <div className="footerLegal"><a href="/terms">Terms</a><a href="/contact">Contact</a><a href="/report-abuse">Report abuse</a></div>
        <div className="footerNote"><span>© 2026 Moog</span><span>Moog controls access, not copies.</span></div>
      </div>
    </footer>
  );
}
