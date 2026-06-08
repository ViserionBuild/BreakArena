const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Read the persisted group JWT from Zustand's localStorage entry. */
function getGroupToken(): string | null {
  try {
    const raw = localStorage.getItem('callbreak-ui');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.groupToken ?? null;
  } catch {
    return null;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getGroupToken();

  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
    ...options,
  });

  let json: ApiEnvelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.statusText || 'Request failed', res.status);
  }

  if (!json.success) {
    throw new ApiError(json.message || 'Request failed', res.status);
  }

  return json.data;
}
