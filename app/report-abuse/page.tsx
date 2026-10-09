"use client";

import { FormEvent, useState } from "react";

export default function ReportAbusePage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("sending"); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/report-abuse", { method: "POST", body: form });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not submit the report.");
      setStatus("sent"); setMessage("Report received. Thank you."); formElement.reset();
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Could not submit the report."); }
  }
  return <main className="legalPage"><article className="legalShell">
    <a className="minimalLogo brandLogo" href="/" aria-label="Moog home"><svg viewBox="0 0 48 48" aria-hidden="true" fill="none"><path d="M25 20.5 22 23.5a7 7 0 0 0 9.9 9.9l4.4-4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M39 27.5 42 24.5a7 7 0 0 0-9.9-9.9l-4.4 4.4" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/><path d="m26 29 12-12" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"/></svg><span>moog</span></a><p className="eyebrow">REPORT ABUSE</p>
    <h1>Report a share.</h1><p>Use this for illegal content, harassment, malware, copyright concerns, or other abuse involving a Moog share.</p>
    <form className="reportForm" onSubmit={submit} aria-describedby="report-help">
      <p id="report-help">Share the exact Moog URL so the team can locate the item. Do not include passwords or private content in the details.</p>
      <label>Share URL<input name="shareUrl" type="url" placeholder="https://your-moog-domain/s/…" required maxLength={500} autoComplete="url"/></label>
      <label>Category<select name="category" defaultValue="illegal"><option value="illegal">Illegal content</option><option value="harassment">Harassment / abuse</option><option value="copyright">Copyright</option><option value="malware">Malware / security</option><option value="privacy">Privacy request</option><option value="other">Other</option></select></label>
      <label>Your email <span>(optional)</span><input name="email" type="email" placeholder="you@example.com" maxLength={254}/></label>
      <label>Details<textarea name="details" rows={7} placeholder="Tell us what should be reviewed." required maxLength={5000}/></label>
      <button className="primary legalButton" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Submit report →"}</button>
      {message ? <p className={status === "error" ? "formError" : "reportSuccess"} role="status">{message}</p> : null}
    </form>
    <a className="minimalNewShare" href="/">Back to Moog <span>→</span></a>
  </article></main>;
}
