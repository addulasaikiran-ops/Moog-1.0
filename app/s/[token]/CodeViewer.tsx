"use client";

import { useMemo, useState } from "react";

const labels: Record<string, string> = {
  javascript: "JavaScript", typescript: "TypeScript", python: "Python", html: "HTML", css: "CSS",
  json: "JSON", sql: "SQL", bash: "Bash", java: "Java", csharp: "C#", cpp: "C++", go: "Go",
  rust: "Rust", php: "PHP", markdown: "Markdown",
};
const extensions: Record<string, string> = { javascript:"js",typescript:"ts",python:"py",html:"html",css:"css",json:"json",sql:"sql",bash:"sh",java:"java",csharp:"cs",cpp:"cpp",go:"go",rust:"rs",php:"php",markdown:"md" };

function detectLanguage(text: string) {
  if (/<(!DOCTYPE|html|div|body|script|style)\b/i.test(text)) return "html";
  if (/^\s*[{[].*[}\]]\s*$/s.test(text) && /"[^"]+"\s*:/.test(text)) return "json";
  if (/\b(def|import|from|print)\s+\w+|:\s*$/m.test(text) && /\bdef\s+\w+\s*\(/.test(text)) return "python";
  if (/\b(const|let|var|function|=>|console\.log)\b/.test(text)) return "javascript";
  if (/\b(SELECT|FROM|INSERT INTO|UPDATE|CREATE TABLE)\b/i.test(text)) return "sql";
  if (/^#!\/bin\/|\becho\s+["']|\b(npm|git|cd|curl)\s+/m.test(text)) return "bash";
  if (/\b(public|private|class|static|void|System\.out)\b/.test(text)) return "java";
  return "text";
}

function escapeHtml(value: string) {
  return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function highlight(text: string, language: string) {
  let s = escapeHtml(text);
  if (language === "html") {
    s = s.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tokTag">$2</span>').replace(/([\w-]+)=(&quot;.*?&quot;)/g, '<span class="tokAttr">$1</span>=$2');
  } else {
    s = s.replace(/(\/\/.*$|#.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="tokComment">$1</span>');
    s = s.replace(/(&quot;(?:\\.|[^&])*?&quot;|'(?:\\.|[^'])*?')/g, '<span class="tokString">$1</span>');
    s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tokNumber">$1</span>');
    s = s.replace(/\b(const|let|var|function|return|if|else|for|while|class|new|import|from|export|async|await|def|in|is|not|and|or|True|False|None|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|public|private|static|fn|struct|impl|use|match)\b/g, '<span class="tokKeyword">$1</span>');
  }
  return s;
}

export default function CodeViewer({ text, language }: { text: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const detected = useMemo(() => language === "text" ? detectLanguage(text) : language, [text, language]);
  const lines = text.split("\n");

  async function copyCode() {
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch {}
  }
  function downloadCode() {
    const ext = extensions[detected] ?? "txt";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = href; a.download = `moog-code.${ext}`; a.click(); URL.revokeObjectURL(href);
  }

  return <div className="codeViewer">
    <div className="codeViewerTop"><span className="codeLanguage">{labels[detected] ?? "Plain text"}{language === "text" && detected !== "text" ? " · detected" : ""}</span><div className="codeActions"><button className="codeCopy" type="button" onClick={copyCode}>{copied ? "Copied ✓" : "Copy"}</button><button className="codeCopy" type="button" onClick={downloadCode}>Download</button></div></div>
    <div className="codeScroll"><pre><code>{lines.map((line, i) => <span className="codeLine" key={i}><span className="lineNumber">{i + 1}</span><span className="lineCode" dangerouslySetInnerHTML={{__html: highlight(line, detected)}} /></span>)}</code></pre></div>
  </div>;
}
