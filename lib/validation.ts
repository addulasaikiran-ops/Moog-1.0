/** Small input validators shared by API routes and regression tests. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Accept only a real Moog share URL on an explicitly trusted origin. */
export function isValidMoogShareUrl(value: string, allowedOrigins: readonly string[]): boolean {
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return false;
    const trusted = allowedOrigins.some((origin) => {
      try { return new URL(origin).origin === parsed.origin; } catch { return false; }
    });
    return trusted && /^\/s\/[A-Za-z0-9_-]{43}\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
}
