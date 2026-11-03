import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./moog-design-system.css";
import "./interface-layout-fixes.css";
import "./moog-redesign.css";
import "./styles/tokens.css";
import "./moog-stitch.css";
import "./moog-experience.css";
import "./moog-signature.css";
import "./moog-restyle.css";
import ThemeToggle from "@/components/ThemeToggle";

const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-geist-mono" });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://moog-1-0.vercel.app";
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
const themeBootstrap = `try { var t = localStorage.getItem("moog-theme"); if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; } catch (_) {}`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <meta name="google-site-verification" content="faNn5oeght5riOAmDiyfA_ki0nCNh6xq2flmzaJ_K7A" />
        <meta name="google-adsense-account" content="ca-pub-8545541842374792" />
        <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body>{children}<ThemeToggle /></body>
    </html>
  );
}
