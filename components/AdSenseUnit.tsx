"use client";

import { useCallback, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

/** Google AdSense display unit. Render this component only on the homepage. */
export default function AdSenseUnit() {
  const initialized = useRef(false);
  const initializeAd = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      initialized.current = false;
      console.error("AdSense initialization failed", error);
    }
  }, []);

  return (
    <aside className="homepageAd" aria-label="Advertisement">
      <span className="homepageAdLabel">Advertisement</span>
      <Script
        id="google-adsense"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8545541842374792"
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onReady={initializeAd}
      />
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-8545541842374792"
        data-ad-slot="5387211476"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
