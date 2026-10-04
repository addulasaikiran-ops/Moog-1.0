import "./globals.css";

export const metadata = {
  title: "Moog — Vanishing text",
  description: "Share text with an expiring link.",
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