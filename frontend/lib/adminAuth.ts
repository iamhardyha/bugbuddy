const ADMIN_ACCESS_KEY = 'adminAccessToken';
const ADMIN_REFRESH_KEY = 'adminRefreshToken';

export function getAdminAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_ACCESS_KEY);
}

export function getAdminRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_REFRESH_KEY);
}

export function saveAdminTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ADMIN_ACCESS_KEY, accessToken);
  localStorage.setItem(ADMIN_REFRESH_KEY, refreshToken);
}

export function clearAdminTokens(): void {
  localStorage.removeItem(ADMIN_ACCESS_KEY);
  localStorage.removeItem(ADMIN_REFRESH_KEY);
}

export function isAdminLoggedIn(): boolean {
  return getAdminAccessToken() !== null;
}
