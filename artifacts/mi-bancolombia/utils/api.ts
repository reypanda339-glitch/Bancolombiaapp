import { Platform } from "react-native";

// On web (PWA), relative paths work via the Replit reverse proxy.
// On native (APK / iOS), there is no browser origin so we need an absolute URL.
// The build configuration uses the active Replit backend by default so the app stays
// synchronized with the web app even when EXPO_PUBLIC_API_URL is not injected.
const _base =
  Platform.OS === "web"
    ? ""
    : (process.env.EXPO_PUBLIC_API_URL ?? "https://bancolombia--appbancolombiav.replit.app").replace(/\/+$/, "");

/**
 * Returns the full URL for an API path.
 * - Web/PWA:  apiUrl("/api/radicados")  →  "/api/radicados"  (relative, proxied)
 * - APK/iOS:  apiUrl("/api/radicados")  →  "https://your-domain.replit.app/api/radicados"
 */
export function apiUrl(path: string): string {
  return `${_base}${path}`;
}
