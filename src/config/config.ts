// Build base URLs that adapt to current host (IP or domain) while preserving path
function pickBase(rawUrl?: string) {
  const raw = rawUrl || "";
  try {
    const url = new URL(raw);
    const hasWindow = typeof window !== "undefined" && !!window.location;
    const currentHost = hasWindow ? window.location.hostname : undefined;
    const isLocal = hasWindow && /^(localhost|127\.0\.0\.1|::1|\[::1\])$/.test(currentHost || "");
    // Only align to current host when NOT on localhost; keep the configured IP when developing locally
    if (currentHost && !isLocal && currentHost !== url.hostname) {
      url.hostname = currentHost;
    }
    // Preserve path (e.g., /auth, /query)
    const path = url.pathname.replace(/\/$/, "");
    return `${url.origin}${path}`;
  } catch {
    return raw;
  }
}

// Resolve base hosts and derive defaults for missing ones
const RAW_API_BASE = (import.meta as any).env.VITE_API_BASE || (import.meta as any).env.VITE_API_AUTH || "";
const RAW_AUTH_BASE = (import.meta as any).env.VITE_AUTH_BASE || (RAW_API_BASE ? new URL("/auth", RAW_API_BASE).toString() : "");
const RAW_QUERY_BASE = (import.meta as any).env.VITE_QUERY_BASE || (RAW_API_BASE ? new URL("/query", RAW_API_BASE).toString() : "");

export const API_BASE = pickBase(RAW_API_BASE);
export const AUTH_BASE = pickBase(RAW_AUTH_BASE);
export const QUERY_BASE = pickBase(RAW_QUERY_BASE);
