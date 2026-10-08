import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://lucid-radiance-production.up.railway.app";

  return {
    rules: [
      { userAgent: "Mediapartners-Google", allow: "/" },
      { userAgent: "Google-Display-Ads-Bot", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/s/", "/api/"] },
    ],
    sitemap: base + "/sitemap.xml",
  };
}