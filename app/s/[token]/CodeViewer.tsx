"use client";

import { useState } from "react";

const labels: Record<string, string> = {
  javascript: "JavaScript", typescript: "TypeScript", python: "Python", html: "HTML",
  css: "CSS", json: "JSON", sql: "SQL", bash: "Bash", java: "Java", csharp: "C#",
  cpp: "C++", go: "Go", rust: "Rust", php: "PHP", markdown: "Markdown",
};

export default function CodeViewer({ text, language }: { text: string; language: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className="codeViewer">
      <div className="codeViewerTop">
        <span className="codeLanguage">{labels[language] ?? language}</span>
        <button className="codeCopy" type="button" onClick={copyCode}>{copied ? "Copied ✓" : "Copy code"}</button>
      </div>
      <pre><code>{text}</code></pre>
    </div>
  );
}
