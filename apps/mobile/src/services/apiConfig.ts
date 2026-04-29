import Constants from 'expo-constants';

// Resolve the base URL the mobile app should hit.
//
// Priority:
//   1. EXPO_PUBLIC_API_URL — set in .env or shell when developer wants a
//      specific URL (e.g. http://10.0.0.5:3000 on a real device, or a
//      cloud URL in the future).
//   2. Auto-detect via Constants.expoConfig.hostUri — Expo Dev Server's
//      LAN IP. We strip the Metro port (e.g. "192.168.1.42:8081") and
//      assume the API runs on :3000 on the same machine. This lets a
//      phone running Expo Go connect to the laptop without env config.
//   3. Falls back to http://localhost:3000 (web dev / simulator).
//
// If nothing resolves, returns null and we run in mock-only mode.
export function getApiBaseUrl(): string | null {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) return envUrl.trim().replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) return `http://${host}:3000`;
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:3000`;
  }

  return null;
}

// Whether the app *can* talk to a live backend. Used by TweaksPanel to
// decide whether to show the live/mock toggle.
export function canUseLiveApi(): boolean {
  return getApiBaseUrl() !== null;
}
