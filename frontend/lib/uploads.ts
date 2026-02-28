import { getAccessToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface UploadResult {
  uploadId: number;
  fileUrl: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
}

/**
 * 이미지 파일을 업로드하고 URL을 반환한다.
 * 실패 시 null 반환.
 */
export async function uploadImage(file: File): Promise<UploadResult | null> {
  const token = getAccessToken();
  if (!token) return null;

  const form = new FormData();
  form.append('file', file);

  try {
    const res = await fetch(`${BASE_URL}/api/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!json.success || !json.data) return null;

    return json.data as UploadResult;
  } catch {
    return null;
  }
}
