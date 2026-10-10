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
type Filter = "All" | "Active" | "Expiring soon" | "Expired" | "One-time views" | "Password protected";

function statusOf(item: RecentShare, now: number): "Active" | "Expiring soon" | "Expired" | "Revoked" | "Viewed" {
  if (item.revoked) return "Revoked";
  if (item.viewOnce && item.viewed) return "Viewed";
  const left = new Date(item.expiresAt).getTime() - now;
  if (left <= 0) return "Expired";
  if (left <= 60 * 60 * 1000) return "Expiring soon";
  return "Active";
}
function relativeTime(value: string, now: number) {
  const delta = now - new Date(value).getTime();
  if (!Number.isFinite(delta)) return "Date unavailable";
  const future = delta < 0;
  const abs = Math.abs(delta);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  const label = days ? days + (days === 1 ? " day" : " days") : hours ? hours + (hours === 1 ? " hour" : " hours") : Math.max(1, mins) + (mins === 1 ? " minute" : " minutes");
  return future ? "in " + label : label + " ago";
}
function expiryLabel(item: RecentShare, now: number) {
  const delta = new Date(item.expiresAt).getTime() - now;
  if (!Number.isFinite(delta)) return "Expiry unavailable";
  if (delta <= 0) return "Expired " + relativeTime(item.expiresAt, now).replace(" ago", " ago");
  return "Expires in " + relativeTime(item.expiresAt, now).replace(/^in /, "");
}
export default function RecentSharesPage() {
  const [items, setItems] = useState<RecentShare[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [now, setNow] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    try {
      const parsed = JSON.parse(window.localStorage.getItem("moog-recent-shares-v1") ?? "[]");
      if (Array.isArray(parsed)) setItems(parsed.filter((item) => item && typeof item.url === "string" && typeof item.code === "string"));
    } catch { setItems([]); }
    return () => window.clearInterval(timer);
  }, []);
  const visible = useMemo(() => items.filter((item) => {
    const state = statusOf(item, now || Date.now());
    const matchesFilter = filter === "All" || state === filter || (filter === "One-time views" && item.viewOnce) || (filter === "Password protected" && item.passwordProtected);
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || item.code.toLowerCase().includes(needle) || item.type.includes(needle));
  }), [items, filter, query, now]);
  useEffect(() => { setPage(1); }, [filter, query]);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const shown = visible.slice((page - 1) * pageSize, page * pageSize);
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setFeedback(label + " copied"); }
    catch { setFeedback("Copy unavailable. Open the share to copy it manually."); }
    window.setTimeout(() => setFeedback(""), 2200);
  }
  function persist(next: RecentShare[]) {
    setItems(next);
    try { window.localStorage.setItem("moog-recent-shares-v1", JSON.stringify(next)); } catch { setFeedback("Could not update local history."); }
  }
  const filters: Filter[] = ["All", "Active", "Expiring soon", "Expired", "One-time views", "Password protected"];
  return <main className="sharesDashboard">
    <header className="sharesDashTopbar"><a className="sharesDashBrand" href="/">Moog<span>◈</span></a><nav><a href="/how-it-works">How it works</a><a className="sharesDashCreateTop" href="/create">+ Create share</a></nav></header>
    <div className="sharesDashShell">
      <div className="sharesDashIntro"><div><p className="sharesDashEyebrow">YOUR PRIVATE SPACE</p><h1>My shares</h1><p>Manage your active and expired shares</p></div><a href="/create" className="sharesDashCreate"><span>＋</span> Create secure share</a></div>
      <section className="sharesDashControls">
        <label className="sharesDashSearch"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search shares by content..." aria-label="Search shares by code or type" /><kbd>⌘ K</kbd></label>
        <div className="sharesDashFilters" aria-label="Filter shares">{filters.map(name => <button key={name} className={filter === name ? "selected" : ""} onClick={() => setFilter(name)}>{name}{name === "Expiring soon" && items.some(i => statusOf(i, now || Date.now()) === "Expiring soon") ? <span className="sharesDashAmberDot" /> : null}</button>)}</div>
      </section>
      <div className="sharesDashSummary"><span><strong>{visible.length}</strong> {visible.length === 1 ? "share" : "shares"}{filter !== "All" ? " · " + filter.toLowerCase() : ""}</span><span className="sharesDashLocalLabel"><span /> Saved on this device</span></div>
      {feedback && <p className="sharesDashFeedback" role="status">{feedback}</p>}
      {shown.length ? <section className="sharesDashList" aria-label="Your shares">{shown.map(item => {
        const state = statusOf(item, now || Date.now());
        return <article className="sharesDashRow" key={item.url}>
          <div className="sharesDashStatusCol"><span className={"sharesDashStatus status-" + state.toLowerCase().replaceAll(" ", "-")}><i />{state}</span><span className="sharesDashTypeIcon">{item.type === "photo" ? "▧" : item.type === "code" ? "</>" : "▤"}</span></div>
          <div className="sharesDashMain"><strong className="sharesDashPreview">{item.type === "photo" ? "Photo share" : item.type === "code" ? "Code snippet" : "Private text share"}</strong><span className="sharesDashCode">Share code · {item.code.replace(/(\d{3})(\d{3})/, "$1 $2")}</span><span className="sharesDashCreated">Created {relativeTime(item.createdAt, now || Date.now())}</span><span className={"sharesDashExpiry " + (state === "Expiring soon" ? "isExpiring" : state === "Expired" ? "isExpired" : "")}>{state === "Expired" || state === "Revoked" || state === "Viewed" ? state === "Expired" ? expiryLabel(item, now || Date.now()) : state === "Revoked" ? "Access revoked" : "Already viewed" : expiryLabel(item, now || Date.now())}</span></div>
          <div className="sharesDashAccess">{item.passwordProtected && <span><b aria-hidden="true">♢</b> Access key protected</span>}{item.viewOnce && <span><b aria-hidden="true">◎</b> One-time view</span>}<span><b aria-hidden="true">◷</b> {item.viewed ? "Viewed" : "View count unavailable"}</span></div>
          <div className="sharesDashActions"><button className="sharesDashCopy" onClick={() => void copy(item.url, "Link")}><span aria-hidden="true">▢</span> Copy link</button><div className="sharesDashMenuWrap"><button className="sharesDashMenuButton" aria-label="Share actions" aria-expanded={menu === item.url} onClick={() => setMenu(menu === item.url ? null : item.url)}>···</button>{menu === item.url && <div className="sharesDashMenu"><a href={item.url} target="_blank" rel="noreferrer">Open share ↗</a><button onClick={() => {void copy(item.code, "Share code");setMenu(null);}}>Copy share code</button><button onClick={() => {setFeedback("Activity details are not available in local history.");setMenu(null);}}>View activity</button><button className="danger" onClick={() => {if(window.confirm("Remove this share from local history? This will not revoke the actual link.")) persist(items.filter(other => other.url !== item.url));setMenu(null);}}>Remove locally</button></div>}</div></div>
        </article>;
      })}</section> : <section className="sharesDashEmpty"><div className="sharesDashEmptyIcon">◈</div><h2>{items.length ? "No matching shares" : "No shares yet"}</h2><p>{items.length ? "Try another search or filter to find what you need." : "Create your first secure share to get started."}</p><a href="/create">Create secure share <span>→</span></a>{!items.length && <small>Your share history is stored on this device, not in your account.</small>}</section>}
      {visible.length > 0 && <footer className="sharesDashPagination"><span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, visible.length)} of {visible.length} shares</span><div><button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button><span>{page} / {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button></div></footer>}
      <p className="sharesDashPrivacy"><span>♢</span> Your message content isn’t stored in this dashboard. Only share metadata is kept locally on this device.</p>
    </div>
  </main>;
}
