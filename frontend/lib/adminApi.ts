import { getAdminAccessToken, clearAdminTokens } from './adminAuth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

export async function adminApiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAdminAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    return {
      success: false,
      data: null,
      error: { code: 'NETWORK_ERROR', message: '서버에 연결할 수 없습니다.' },
    };
  }

  if (res.status === 401) {
    clearAdminTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    return {
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: '인증이 만료되었습니다.' },
    };
  }

  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      data: null,
      error: { code: 'PARSE_ERROR', message: '응답을 처리할 수 없습니다.' },
    };
  }
}
