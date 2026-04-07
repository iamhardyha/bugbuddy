const ADMIN_ACCESS_KEY = 'adminAccessToken';

export function getAdminAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_ACCESS_KEY);
}

export function saveAdminTokens(accessToken: string): void {
  localStorage.setItem(ADMIN_ACCESS_KEY, accessToken);
}

export function clearAdminTokens(): void {
  localStorage.removeItem(ADMIN_ACCESS_KEY);
}

export function isAdminLoggedIn(): boolean {
  const token = getAdminAccessToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
