/**
 * Base URL for Django REST API (must end with /api, no trailing slash).
 * If VITE_API_URL is set to http://host:port only, /api is appended.
 *
 * In development, when VITE_API_USE_PROXY is true/1 or VITE_API_URL is empty,
 * returns "/api" so requests go through the Vite proxy (see vite.config.js),
 * which avoids calling the wrong host and fixes "received HTML instead of JSON".
 */
export function getApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
  const isDev = import.meta.env.DEV;
  const proxyFlag = import.meta.env.VITE_API_USE_PROXY;

  if (raw && /:5173(\/|$)/.test(raw)) {
    console.warn(
      "[api] VITE_API_URL must not use the Vite dev port. Using same-origin /api proxy in development."
    );
    return isDev ? "/api" : "http://localhost:8000/api";
  }

  const useDevProxy =
    isDev &&
    (proxyFlag === "true" ||
      proxyFlag === "1" ||
      raw === "");

  if (useDevProxy) {
    return "/api";
  }

  if (!raw) {
    return "http://localhost:8000/api";
  }

  if (/\/api$/i.test(raw)) return raw;
  return `${raw}/api`;
}
