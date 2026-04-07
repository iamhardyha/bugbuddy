import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './auth';
import type { TokenResponse } from '@/types/user';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

async function refreshTokens(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return null;
  }

  if (!res.ok) {
    clearTokens();
    return null;
  }

  let json: ApiResponse<TokenResponse>;
  try {
    json = await res.json();
  } catch {
    clearTokens();
    return null;
  }
  if (!json.success || !json.data) {
    clearTokens();
    return null;
  }

  saveTokens(json.data.accessToken, json.data.refreshToken);
  return json.data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<ApiResponse<T>> {
  const accessToken = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    return { success: false, data: null, error: { code: 'NETWORK_ERROR', message: '서버에 연결할 수 없습니다.' } };
  }

  if (res.status === 401 && retry) {
    const newToken = await refreshTokens();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
    if (typeof window !== 'undefined') window.location.href = '/';
    return { success: false, data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } };
  }

  try {
    return await res.json() as ApiResponse<T>;
  } catch {
    return { success: false, data: null, error: { code: 'PARSE_ERROR', message: '응답을 처리할 수 없습니다.' } };
  }
}
