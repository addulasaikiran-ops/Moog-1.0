"use client";

import { useEffect, useMemo, useState } from "react";

type RecentShare = {
  type: "text" | "code" | "photo";
  createdAt: string;
  expiresAt: string;
  url: string;
  code: string;
  passwordProtected: boolean;
  viewOnce: boolean;
  revoked?: boolean;
  viewed?: boolean;
};
type Filter = "All" | "Active" | "Expiring soon" | "Expired" | "Revoked" | "Viewed";

function statusOf(item: RecentShare, now: number): Filter {
  if (item.revoked) return "Revoked";
  if (item.viewed) return "Viewed";
  const left = new Date(item.expiresAt).getTime() - now;
  if (left <= 0) return "Expired";
  if (left <= 60 * 60 * 1000) return "Expiring soon";
  return "Active";
}
function remaining(value: string, now: number) {
  const seconds = Math.max(0, Math.ceil((new Date(value).getTime() - now) / 1000));
  if (!seconds) return "Expired";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m ${seconds % 60}s`;
}

export default function RecentSharesPage() {
  const [items, setItems] = useState<RecentShare[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [now, setNow] = useState(0);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    try {
      const parsed = JSON.parse(window.localStorage.getItem("moog-recent-shares-v1") ?? "[]");
      if (Array.isArray(parsed)) setItems(parsed.filter((item) => item && typeof item.url === "string" && typeof item.code === "string"));
    } catch { setItems([]); }
    return () => window.clearInterval(timer);
  }, []);
  const visible = useMemo(() => items.filter((item) => {
    const state = statusOf(item, now || Date.now());
    const matchesFilter = filter === "All" || state === filter || (filter === "Viewed" && item.viewed === true);
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || item.code.includes(needle) || item.type.includes(needle));
  }), [items, filter, query, now]);
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setFeedback(`${label} copied`); }
    catch { setFeedback("Copy unavailable. Open the share to copy it manually."); }
    window.setTimeout(() => setFeedback(""), 2000);
  }
  function persist(next: RecentShare[]) {
    setItems(next);
    try { window.localStorage.setItem("moog-recent-shares-v1", JSON.stringify(next)); } catch { setFeedback("Could not update local history."); }
  }
  return <main className="recentPage">
    <div className="recentShell">
      <header className="recentTopbar"><a className="recentLogo" href="/">◈ Moog</a><a href="/">← Back to create share</a></header>
      <section className="recentIntro"><p className="recentEyebrow">LOCAL HISTORY · THIS DEVICE</p><h1>Recent shares</h1><p>Find links you created on this device. Shared content itself is not stored in this history.</p></section>
      <section className="recentControls">
        <label className="recentSearch"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by code or type" aria-label="Search recent shares" /></label>
        <button className="recentClear" onClick={() => { if (window.confirm("Clear local share history on this device? This will not revoke existing links.")) persist([]); }}>Clear local history</button>
      </section>
      <div className="recentFilters" aria-label="Filter shares">{(["All","Active","Expiring soon","Expired","Revoked","Viewed"] as Filter[]).map((name) => <button key={name} className={filter === name ? "selected" : ""} onClick={() => setFilter(name)}>{name}</button>)}</div>
      {feedback ? <p className="recentFeedback" role="status">{feedback}</p> : null}
      {visible.length ? <section className="recentList" aria-label="Recent shares">{visible.map((item) => {
        const state = statusOf(item, now || Date.now());
        return <article className="recentItem" key={item.url}>
          <div className="recentItemHead"><span className="recentType">{item.type === "photo" ? "▧" : item.type === "code" ? "</>" : "▤"} <b>{item.type}</b></span><span className={`recentStatus status-${state.toLowerCase().replaceAll(" ", "-")}`}>{state}</span></div>
          <div className="recentCode">{item.code.replace(/(\d{3})(\d{3})/, "$1 $2")}</div>
          <div className="recentChips"><span>{item.passwordProtected ? "Password protected" : "No password"}</span><span>{item.viewOnce ? "View once" : "Multiple views"}</span><span>Expires {remaining(item.expiresAt, now || Date.now())}</span></div>
          <div className="recentActions"><button onClick={() => void copy(item.url, "Link")}>Copy link</button><button onClick={() => void copy(item.code, "Code")}>Copy code</button><a href={item.url} target="_blank" rel="noreferrer">Open share ↗</a><button className="recentRemove" onClick={() => persist(items.filter((other) => other.url !== item.url))}>Remove locally</button></div>
        </article>;
      })}</section> : <section className="recentEmpty"><div>◈</div><h2>{items.length ? "No matching shares" : "No recent shares on this device."}</h2><p>{items.length ? "Try another search or filter." : "Create a share and its non-sensitive details will appear here."}</p><a href="/#composer">Create your first secure share →</a></section>}
      <p className="recentPrivacy">Local history can be cleared at any time. Clearing it does not revoke or delete shares from the server.</p>
    </div>
  </main>;
}
