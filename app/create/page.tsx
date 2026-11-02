"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Composer, { type CreatedShare } from "@/components/Composer";
import ShareResult from "@/components/ShareResult";

export default function CreateSharePage() {
  const [createdShare, setCreatedShare] = useState<CreatedShare | null>(null);
  return <main className="createSharePage">
    <SiteHeader active="create" />
    <div className="createShareShell">
      <a className="createShareBack" href="/">← <span>Back to Moog</span></a>
      <div className="createShareHeading">
        <p className="recentEyebrow">PRIVATE SHARING / COMPOSER</p>
        <h1>Create a private share.</h1>
        <p>Configure your temporary content, choose an expiration window, and define the access options you need.</p>
      </div>
      {createdShare ? <ShareResult share={createdShare} onCreateAnother={() => { setCreatedShare(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} /> : <Composer compact onCreated={setCreatedShare} />}
      <p className="createShareEncryption">Sent over HTTPS. Not end-to-end encrypted. The server can technically read active share content.</p>
    </div>
    <SiteFooter />
  </main>;
}
