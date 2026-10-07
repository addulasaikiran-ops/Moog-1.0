"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

function friendlyError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code) : "";
  if (code === "auth/invalid-credential") return "Email or password is incorrect.";
  if (code === "auth/email-already-in-use") return "That email already has an account. Sign in instead.";
  if (code === "auth/weak-password") return "Use a stronger password (at least 6 characters).";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/too-many-requests") return "Too many attempts. Try again later.";
  return error instanceof Error ? error.message : "Authentication failed.";
}

export default function AuthPanel() {
  const { user, ready, signIn, signUp, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") await signIn(email.trim(), password);
      else await signUp(email.trim(), password);
      setPassword("");
      setOpen(false);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <div className="authPanel"><span className="authMuted">Checking account…</span></div>;

  if (user) {
    return (
      <div className="authPanel">
        <span className="authUser" title={user.email ?? undefined}>{user.email}</span>
        <button className="authButton" type="button" onClick={() => void logout()}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="authPanel">
      <button className="authButton authPrimary" type="button" onClick={() => { setOpen((value) => !value); setError(""); }}>
        Sign in
      </button>
      {open ? (
        <div className="authCard">
          <div className="authTitle">{mode === "signin" ? "Welcome back" : "Create your account"}</div>
          <div className="authHint">{mode === "signin" ? "Sign in to create and revoke your shares." : "Create an account to manage your shares."}</div>
          <form onSubmit={submit}>
            <input className="authInput" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            <input className="authInput" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" minLength={6} required />
            {error ? <div className="authError" role="alert">{error}</div> : null}
            <button className="primary authSubmit" type="submit" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button className="authSwitch" type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}>
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
