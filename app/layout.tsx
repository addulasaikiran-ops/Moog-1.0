import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lucid-radiance-production.up.railway.app";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Moog — Temporary Sharing", template: "%s — Moog" },
  description: "Moog is temporary access-controlled sharing for text, code, and photos. No account required.",
  applicationName: "Moog",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: { type: "website", url: siteUrl, siteName: "Moog", title: "Moog — Temporary Sharing", description: "Create temporary access-controlled links for text, code, and photos." },
  twitter: { card: "summary_large_image", title: "Moog — Temporary Private Sharing", description: "Temporary access-controlled sharing for text, code, and photos." },
  icons: { icon: "/moog.svg", shortcut: "/moog.svg", apple: "/moog.svg" },
};
const structuredData = { "@context": "https://schema.org", "@type": "WebSite", name: "Moog", url: siteUrl, description: "Temporary access-controlled sharing for text, code, and photos." };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <html lang="en"><head><meta name="google-site-verification" content="faNn5oeght5riOAmDiyfA_ki0nCNh6xq2flmzaJ_K7A" /><meta name="google-adsense-account" content="ca-pub-854551842374792" /><script nonce={nonce} async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-854551842374792" crossOrigin="anonymous"></script><script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></head><body>{children}</body></html>;
}