"use client";

import { FormEvent, useState } from "react";

export default function HomePage() {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setUrl("");

    if (!text.trim()) {
      setError("Enter some text first.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not create link.");
      }

      setUrl(data.url ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="home">
      <div className="container">
        <section className="card">
          <h1 className="brand">Moog</h1>
          <p className="subtitle">
            Paste text. Create a link. It disappears after one hour.
          </p>

          <form onSubmit={handleSubmit}>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Write something to share…"
              maxLength={100000}
              aria-label="Text to share"
            />

            <div className="actions">
              <span className="note">No login. No account. Expires in 1 hour.</span>
              <button className="primary" type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create Link"}
              </button>
            </div>
          </form>

          {error ? <p className="error">{error}</p> : null}

          {url ? (
            <div className="result">
              <strong>Your link:</strong>{" "}
              <a href={url} target="_blank" rel="noreferrer">
                {url}
              </a>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}