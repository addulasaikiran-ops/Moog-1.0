import "./globals.css";

export const metadata = {
  title: "Moog — Vanishing text",
  description: "Share text with an expiring link.",
  icons: {
    icon: "/moog.svg",
    shortcut: "/moog.svg",
    apple: "/moog.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}