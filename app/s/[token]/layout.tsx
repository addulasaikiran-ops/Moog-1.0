import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private share — Moog",
  description: "Temporary Moog share. Content is not indexed.",
  robots: { index: false, follow: false, noarchive: true, googleBot: { index: false, follow: false, noarchive: true } },
};

export default function ShareLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
