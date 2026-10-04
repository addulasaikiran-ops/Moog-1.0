import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lucid-radiance-production.up.railway.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Moog 1.0 — Private Temporary Sharing",
    template: "%s — Moog 1.0",
  },
  description: "Moog 1.0 is a private, temporary sharing tool for text, code, and photos. Create an expiring link without an account.",
  applicationName: "Moog 1.0",
  keywords: ["Moog 1.0", "Moog", "temporary sharing", "private sharing", "expiring links", "share text", "share code", "share photos"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Moog 1.0",
    title: "Moog 1.0 — Private Temporary Sharing",
    description: "Create private, expiring links for text, code, and photos. No account required.",
  },
  twitter: {
    card: "summary",
    title: "Moog 1.0 — Private Temporary Sharing",
    description: "Private, temporary sharing for text, code, and photos.",
  },
  icons: { icon: "/moog.svg", shortcut: "/moog.svg", apple: "/moog.svg" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Moog 1.0",
  alternateName: "Moog",
  url: siteUrl,
  description: "Private, temporary sharing for text, code, and photos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="faNn5oeght5riOAmDiyfA_ki0nCNh6xq2flmzaJ_K7A" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
