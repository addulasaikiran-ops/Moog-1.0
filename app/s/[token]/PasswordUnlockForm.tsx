"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function PasswordUnlockForm({ action, error }: { action: string; error?: "invalid" | "missing" }) {
  const [visible, setVisible] = useState(false);
  return <form action={action} method="post">
    <label className="viewerLabel" htmlFor="password">SHARE PASSWORD</label>
    <div className="passwordRow">
      <input className="passwordInput" id="password" name="password" type={visible ? "text" : "password"} placeholder="Enter password" autoComplete="current-password" autoFocus required aria-describedby={error ? "password-error" : undefined} />
      <button className="passwordVisibility" type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? "Hide" : "Show"}</button>
      <button className="primary" type="submit">Unlock <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" /></button>
    </div>
    {error && <p id="password-error" className="passwordError" role="alert">{error === "invalid" ? "That password is not correct. Try again." : "Enter the password to continue."}</p>}
  </form>;
}
