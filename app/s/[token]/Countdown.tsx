"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Countdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const expiry = new Date(expiresAt).getTime();

    const tick = () => {
      const next = expiry - Date.now();
      if (next <= 0) {
        setRemaining(0);
        window.location.reload();
        return;
      }
      setRemaining(next);
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="countdownWrap" aria-live="polite">
      <span className="countdownLabel">EXPIRES IN</span>
      <strong className={remaining !== null && remaining < 60_000 ? "countdownUrgent" : ""}>
        {remaining === null ? "—" : remaining === 0 ? "Expired" : formatRemaining(remaining)}
      </strong>
    </div>
  );
}
