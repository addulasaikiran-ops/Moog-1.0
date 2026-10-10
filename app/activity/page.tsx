"use client";

import { useState } from "react";

type EventFilter = "All events" | "Views" | "Access attempts" | "Revocation events" | "Expiration events";

const filters: { label: EventFilter; icon: string }[] = [
  { label: "All events", icon: "☷" },
  { label: "Views", icon: "◎" },
  { label: "Access attempts", icon: "♙" },
  { label: "Revocation events", icon: "⊗" },
  { label: "Expiration events", icon: "◷" },
];

export default function ActivityLogPage() {
  const [filter, setFilter] = useState<EventFilter>("All events");
  const [range, setRange] = useState("7");
  return (
    <main className="activityPage">
      <header className="activityTopbar">
        <a className="activityBrand" href="/" aria-label="Moog home">Moog</a>
        <nav><a href="/#how-it-works">How it works</a><a href="/recent">My shares</a><a className="activityAvatar" href="/recent" aria-label="My shares">M</a></nav>
      </header>
      <div className="activityLayout">
        <aside className="activitySidebar" aria-label="Main navigation">
          <a href="/"> <span>⌂</span> Home</a>
          <a href="/create"><span>⊕</span> Create share</a>
          <a href="/recent"><span>▤</span> My shares</a>
          <a href="/activity" className="selected"><span>◷</span> Activity log</a>
          <a href="/#security"><span>⚙</span> Security</a>
        </aside>
        <section className="activityMain">
          <div className="activityHeading">
            <div><p className="activityEyebrow">SECURITY &amp; VISIBILITY</p><h1>Activity log</h1><p className="activitySubtitle">See who accessed your shares and when</p></div>
            <label className="activityDate"><span aria-hidden="true">▦</span><span className="srOnly">Date range</span><select value={range} onChange={(event) => setRange(event.target.value)}><option value="1">Last 24 hours</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select><span aria-hidden="true">⌄</span></label>
          </div>
          <div className="activityFilters" role="group" aria-label="Filter activity events">
            {filters.map((item) => <button type="button" key={item.label} className={filter === item.label ? "active" : ""} aria-pressed={filter === item.label} onClick={() => setFilter(item.label)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
          </div>
          <div className="activitySummary"><div><span className="activitySummaryIcon">◷</span><div><strong>Share activity</strong><p>Access events and security changes</p></div></div><span className="activityLive"><i /> Audit history</span></div>
          <section className="activityEmpty" aria-live="polite">
            <div className="activityEmptyIcon" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><rect x="11" y="9" width="42" height="48" rx="9" stroke="currentColor" strokeWidth="2.5"/><path d="M22 23h20M22 32h12M22 41h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><circle cx="47" cy="46" r="10" fill="#F8FAFC" stroke="currentColor" strokeWidth="2.5"/><path d="M47 40v6l4 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg></div>
            <h2>No activity yet</h2>
            <p>Activity will appear here when your shares are accessed.</p>
            <p className="activityEmptyNote">{filter === "All events" ? "View history, access attempts, revocations and expirations will be collected here when audit logging is available." : `No ${filter.toLowerCase()} to show for this period.`}</p>
            <a href="/recent" className="activityPrimary">View my shares <span aria-hidden="true">→</span></a>
          </section>
          <div className="activityPrivacy"><span aria-hidden="true">⌑</span><p><strong>Privacy first</strong><br />Moog only shows activity that can be reliably recorded. Device and IP details will appear only when collected and available.</p></div>
          <footer className="activityFooter"><a href="/">Moog</a><span>Moog controls access, not copies.</span><a href="/privacy">Privacy</a></footer>
        </section>
      </div>
      <style jsx global>{`
        .activityPage{min-height:100vh;background:#F8FAFC;color:#0F172A;font-family:inherit}
        .activityTopbar{height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;background:#fff;border-bottom:1px solid #E2E8F0}
        .activityBrand{font-size:27px;font-weight:850;letter-spacing:-1.2px;color:#2563EB;text-decoration:none}
        .activityTopbar nav{display:flex;align-items:center;gap:28px}.activityTopbar nav>a{font-size:14px;color:#475569;text-decoration:none}.activityTopbar nav>a:hover{color:#2563EB}
        .activityAvatar{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:#DBEAFE;color:#2563EB!important;font-weight:700}
        .activityLayout{display:grid;grid-template-columns:232px minmax(0,1fr);min-height:calc(100vh - 60px)}
        .activitySidebar{padding:24px 16px;border-right:1px solid #E2E8F0;background:#fff;display:flex;flex-direction:column;gap:6px}
        .activitySidebar a{display:flex;align-items:center;gap:13px;padding:12px 14px;border-radius:9px;color:#475569;text-decoration:none;font-size:14px;font-weight:550}
        .activitySidebar a span{font-size:21px;width:22px;text-align:center;color:#64748B}
        .activitySidebar a:hover{background:#F8FAFC}.activitySidebar a.selected{color:#2563EB;background:#EFF6FF;font-weight:700;box-shadow:inset 3px 0 #2563EB}.activitySidebar a.selected span{color:#2563EB}
        .activityMain{min-width:0;padding:30px clamp(20px,3vw,44px) 24px;max-width:1600px;width:100%;margin:0 auto}
        .activityHeading{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px}
        .activityEyebrow{font-size:11px;font-weight:750;letter-spacing:1.5px;color:#64748B;margin:0 0 7px}
        .activityHeading h1{font-size:32px;line-height:1.15;letter-spacing:-1px;margin:0;font-weight:800;color:#0F172A}
        .activitySubtitle{font-size:16px;color:#64748B;margin:8px 0 0}
        .activityDate{height:44px;display:flex;align-items:center;gap:12px;padding:0 13px;border:1px solid #E2E8F0;border-radius:10px;background:#fff;color:#64748B;white-space:nowrap}
        .activityDate select{border:0;outline:0;background:transparent;color:#334155;font:inherit;font-size:13px;cursor:pointer}
        .activityFilters{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:20px}
        .activityFilters button{display:flex;align-items:center;gap:8px;min-height:40px;padding:0 14px;border:1px solid #E2E8F0;border-radius:9px;background:#fff;color:#475569;font:inherit;font-size:13px;cursor:pointer;transition:background .15s,border-color .15s}
        .activityFilters button span{font-size:17px}.activityFilters button:hover{border-color:#93C5FD}.activityFilters button.active{background:#DBEAFE;border-color:#DBEAFE;color:#1D4ED8;font-weight:700}
        .activitySummary{display:flex;align-items:center;justify-content:space-between;gap:14px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:15px 18px;margin-bottom:12px}
        .activitySummary>div{display:flex;align-items:center;gap:12px}.activitySummaryIcon{width:38px;height:38px;border-radius:10px;background:#EFF6FF;color:#2563EB;display:grid;place-items:center;font-size:21px}
        .activitySummary strong{font-size:14px}.activitySummary p{font-size:12px;color:#64748B;margin:4px 0 0}
        .activityLive{display:flex;align-items:center;gap:7px;color:#64748B;font-size:12px}.activityLive i{width:7px;height:7px;border-radius:50%;background:#94A3B8}
        .activityEmpty{background:#fff;border:1px solid #E2E8F0;border-radius:10px;min-height:365px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:36px 20px}
        .activityEmptyIcon{width:78px;height:78px;border-radius:22px;background:#EFF6FF;color:#2563EB;display:grid;place-items:center;margin-bottom:20px}.activityEmptyIcon svg{width:48px;height:48px}
        .activityEmpty h2{font-size:21px;font-weight:750;letter-spacing:-.4px;margin:0 0 8px}.activityEmpty>p{font-size:14px;color:#64748B;line-height:1.6;margin:0}
        .activityEmpty .activityEmptyNote{max-width:440px;margin-top:10px;font-size:12px;color:#94A3B8}
        .activityPrimary{display:inline-flex;align-items:center;gap:10px;margin-top:22px;min-height:42px;padding:0 16px;background:#2563EB;border-radius:9px;color:#fff;text-decoration:none;font-size:13px;font-weight:650}.activityPrimary:hover{background:#1D4ED8}
        .activityPrivacy{display:flex;align-items:flex-start;gap:12px;padding:15px 17px;margin-top:14px;border:1px solid #DBEAFE;border-radius:10px;background:#EFF6FF;color:#1E40AF}
        .activityPrivacy>span{font-size:21px}.activityPrivacy p{font-size:12px;line-height:1.7;color:#475569;margin:0}.activityPrivacy strong{font-size:13px;color:#1E40AF}
        .activityFooter{display:flex;align-items:center;gap:20px;margin-top:28px;padding-top:17px;border-top:1px solid #E2E8F0;color:#94A3B8;font-size:12px}.activityFooter a{color:#64748B;text-decoration:none}.activityFooter a:first-child{font-weight:800;color:#2563EB;font-size:16px}.activityFooter span{margin-right:auto}
        .srOnly{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        @media(max-width:900px){.activityLayout{grid-template-columns:72px minmax(0,1fr)}.activitySidebar{padding:20px 10px}.activitySidebar a{justify-content:center;padding:12px 8px;font-size:0}.activitySidebar a span{font-size:21px}.activityMain{padding:24px 18px}}
        @media(max-width:620px){.activityTopbar{padding:0 16px}.activityTopbar nav{gap:14px}.activityTopbar nav>a:not(.activityAvatar){display:none}.activityLayout{display:block}.activitySidebar{position:static;flex-direction:row;overflow-x:auto;padding:8px 10px;border-right:0;border-bottom:1px solid #E2E8F0}.activitySidebar a{flex:0 0 auto;font-size:12px;gap:6px;padding:9px 10px}.activitySidebar a span{font-size:16px;width:auto}.activityMain{padding:22px 12px}.activityHeading{align-items:flex-start;flex-direction:column}.activityHeading h1{font-size:29px}.activityDate{width:100%;justify-content:space-between}.activityFilters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.activityFilters button{justify-content:flex-start;padding:0 10px;font-size:12px}.activityFilters button:last-child{grid-column:span 2}.activitySummary{padding:12px}.activityLive{font-size:11px}.activityEmpty{min-height:320px;padding:26px 16px}.activityFooter{gap:12px;font-size:11px}}
      `}</style>
    </main>
  );
}
