"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import Composer, { type CreatedShare } from "@/components/Composer";
import ShareResult from "@/components/ShareResult";

export default function CreateSharePage() {
  const [createdShare, setCreatedShare] = useState<CreatedShare | null>(null);
  return <main className="createSharePage">
    <header className="createShareTopbar">
      <Logo className="createShareLogo" />
      <nav aria-label="Create share navigation"><a href="/how-it-works">How it works</a><a href="/recent">Recent shares</a></nav>
    </header>
    <div className="createShareShell">
      <a className="createShareBack" href="/">← <span>Back to Moog</span></a>
      <div className="createShareHeading"><h1>Create a private share</h1><p>Share text, code, or a photo. Choose an expiry and optional access controls.</p></div>
      {createdShare ? <ShareResult share={createdShare} onCreateAnother={() => { setCreatedShare(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} /> : <Composer compact onCreated={setCreatedShare} />}
      <p className="createShareEncryption">Sent over HTTPS. Not end-to-end encrypted. The server can technically read active share content.</p>
    </div>
  </main>;
}
