"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { CreatedShare } from "@/components/Composer";

type RecentShare = { url: string; revoked?: boolean; [key: string]: unknown };
function formatCountdown(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (days) return days + "d " + hours + "h";
  if (hours) return hours + "h " + minutes + "m";
  if (minutes) return minutes + "m " + remainder + "s";
  return remainder + "s";
}

export default function ShareResult({ share, onCreateAnother }: { share: CreatedShare; onCreateAnother: () => void }) {
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState<"link" | "code" | "">("");
  const [revoked, setRevoked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);

  async function copy(value: string, kind: "link" | "code") {
    try { await navigator.clipboard.writeText(value); setCopied(kind); setFeedback(kind === "link" ? "Private link copied." : "Share code copied."); window.setTimeout(() => setCopied(""), 2000); }
    catch { setError("Clipboard access failed. Select and copy the value manually."); }
  }
  async function shareLink() {
    try {
      if (navigator.share) await navigator.share({ title: "A private Moog share", text: "Open this temporary share", url: share.url });
      else await copy(share.url, "link");
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") setError("Could not open the share menu.");
    }
  }
  async function revoke() {
    const token = new URL(share.url).pathname.split("/").filter(Boolean).pop();
    if (!token) { setError("Could not identify this share."); return; }
    setRevoking(true); setError("");
    try {
      const response = await fetch("/api/shares/" + encodeURIComponent(token) + "/revoke", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revokeToken: share.revokeToken }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not revoke this share.");
      setRevoked(true); setDialogOpen(false); setFeedback("Share revoked. Its link and code can no longer be used.");
      try {
        const key = "moog-recent-shares-v1";
        const items = JSON.parse(window.localStorage.getItem(key) ?? "[]") as RecentShare[];
        window.localStorage.setItem(key, JSON.stringify(items.map(item => item.url === share.url ? { ...item, revoked: true } : item)));
      } catch { /* Server revocation is authoritative; local history is best-effort. */ }
    } catch (err) { setError(err instanceof Error ? err.message : "Could not revoke this share."); }
    finally { setRevoking(false); }
  }

  const remaining = new Date(share.expiresAt).getTime() - now;
  const active = !revoked && remaining > 0;
  return <>
    <section className="result resultExpanded sharedResult" data-ui="created-link" aria-labelledby="share-ready-title">
      <div className="resultSuccessRow"><div className="resultIcon" aria-hidden="true">{revoked ? <XCircle size={22} strokeWidth={1.5} /> : <CheckCircle2 size={22} strokeWidth={1.5} />}</div><div><div className="resultLabel">{revoked ? "ACCESS REVOKED" : "SHARE CREATED"}</div><h2 id="share-ready-title">{revoked ? "This share has been revoked." : "Your share is ready."}</h2><p>{revoked ? "The link and code can no longer be used." : "Share the private link or send the six-digit code separately."}</p></div></div>
      {active ? <div className="resultBody">
        <div className="resultFieldLabel">PRIVATE LINK</div>
        <div className="resultLinkRow"><a href={share.url} target="_blank" rel="noreferrer">{share.url}</a><button className="copy resultPrimaryCopy" type="button" onClick={() => void copy(share.url, "link")}>{copied === "link" ? "Copied" : "Copy link"}</button></div>
        <div className="uniqueCodeBox"><div><span>6-DIGIT SHARE CODE</span><strong>{share.code.replace(/(\d{3})(\d{3})/, "$1 $2")}</strong></div><button className="copy codeCopyButton" type="button" onClick={() => void copy(share.code, "code")}>{copied === "code" ? "Copied" : "Copy code"}</button></div>
        <div className="resultMetaGrid" aria-label="Share details"><div><span>EXPIRES AT</span><strong>{new Date(share.expiresAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</strong></div><div><span>TIME REMAINING</span><strong>{remaining > 0 ? formatCountdown(remaining) : "Expired"}</strong></div><div><span>ACCESS</span><strong>{share.passwordProtected ? "Password protected" : "No password"}</strong></div><div><span>VIEWING</span><strong>{share.viewOnce ? "View once" : "Until expiry"}</strong></div></div>
        <p className="resultNote">Keep the link private. Anyone who has it can attempt to open the share.</p>
      </div> : <p className="revokeNotice" role="status">{revoked ? "Access has been revoked." : "This share has expired."}</p>}
      {error && <p className="formError" role="alert">{error}</p>}
      <div className="resultBottom"><span className="copyFeedback" aria-live="polite">{copied ? "Copied" : feedback || (active ? "Ready to share." : "Share is no longer active.")}</span><div className="shareResultActions">{active && <><button className="resultNewButton" type="button" onClick={() => void shareLink()}>Share…</button><button className="revokeButton" type="button" onClick={() => setDialogOpen(true)} disabled={revoking}>Revoke link</button></>}<button className="resultNewButton" type="button" onClick={onCreateAnother}>Create another</button></div></div>
    </section>
    <ConfirmDialog open={dialogOpen} title="Revoke this share?" description="Anyone using this link or code will lose access immediately. This action cannot be undone." confirmLabel="Revoke share" busy={revoking} onCancel={() => setDialogOpen(false)} onConfirm={() => void revoke()} />
  </>;
}
