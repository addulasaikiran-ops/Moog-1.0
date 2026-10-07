export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowed = new Set<string>();
  const addOrigin = (value: string | null | undefined) => {
    if (!value) return;
    try {
      allowed.add(new URL(value.includes("://") ? value : `https://${value}`).origin);
    } catch {}
  };

  addOrigin(process.env.NEXT_PUBLIC_APP_URL);
  addOrigin(process.env.RAILWAY_PUBLIC_DOMAIN);

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) addOrigin(`${forwardedProto || "https"}://${forwardedHost}`);

  try {
    allowed.add(new URL(request.url).origin);
  } catch {}

  return allowed.has(origin);
}
