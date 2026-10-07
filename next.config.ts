import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self'${isProduction ? "" : " 'unsafe-eval'"} 'unsafe-inline'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  async headers() {
    return [\n      { source: "/(.*)", headers: securityHeaders },\n      { source: "/s/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }, { key: "Cache-Control", value: "no-store" }, { key: "Referrer-Policy", value: "no-referrer" }] },\n      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }, { key: "Cache-Control", value: "no-store" }] },\n    ];
  },
};

export default nextConfig;
