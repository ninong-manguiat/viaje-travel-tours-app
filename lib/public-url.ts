import type { NextRequest } from "next/server";

const PRODUCTION_APP_URL = "https://viajetravelandtours.com";

function cleanBaseUrl(value?: string | null) {
  const normalized = String(value || "").trim().replace(/\/+$/, "");
  if (!normalized) return "";
  if (normalized.includes("your-domain.com") || normalized.includes("qa.your-domain.com")) return "";
  return normalized;
}

function isLocalUrl(value: string) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
  } catch {
    return false;
  }
}

function isLegacyPublicUrl(value: string) {
  try {
    return new URL(value).hostname.endsWith(".netlify.app");
  } catch {
    return false;
  }
}

export function publicAppBaseUrl(request?: NextRequest) {
  const configured = cleanBaseUrl(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL);
  // Transactional links must never revive the former Netlify delivery URL.
  // Local hosts remain useful for development; production falls back to the
  // official public domain when a stale deployment value is present.
  if (configured && !isLegacyPublicUrl(configured)) return configured;

  if (request) {
    const requestOrigin = cleanBaseUrl(`${request.nextUrl.protocol}//${request.nextUrl.host}`);
    if (requestOrigin && isLocalUrl(requestOrigin)) return requestOrigin;
  }

  if (typeof window !== "undefined") {
    const windowOrigin = cleanBaseUrl(window.location.origin);
    if (windowOrigin && isLocalUrl(windowOrigin)) return windowOrigin;
  }

  return PRODUCTION_APP_URL;
}

export function publicAppUrl(path = "", request?: NextRequest) {
  return `${publicAppBaseUrl(request)}/${path.replace(/^\/+/, "")}`;
}
