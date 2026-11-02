import type { AnchorHTMLAttributes } from "react";

type LogoProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href?: string;
  compact?: boolean;
};

export default function Logo({ href = "/", compact = false, className = "moogLogo", ...props }: LogoProps) {
  return (
    <a href={href} className={className} aria-label="Moog home" {...props}>
      <svg className="moogBrandMark" aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path d="M12 2.75 21.25 12 12 21.25 2.75 12 12 2.75Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8.5 12h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {!compact && <span>moog</span>}
    </a>
  );
}
