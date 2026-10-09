export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type AuthSession = {
  token: string;
  expiresAt: string;
  user: AuthUser;
};

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
export const apiBaseUrl = (configuredApiUrl || 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = 'REQUEST_FAILED', status = 0) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...requestOptions,
      headers: {
        Accept: 'application/json',
        ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(
      `Cannot reach the WatchDog backend at ${apiBaseUrl}. Check EXPO_PUBLIC_API_URL and confirm the backend is running.`,
      'NETWORK_ERROR',
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) {
    throw new ApiError(
      body.error?.message || 'WatchDog could not complete the request.',
      body.error?.code || 'REQUEST_FAILED',
      response.status,
    );
  }

  return body;
}

export function signup(input: { name: string; email: string; password: string }): Promise<AuthSession> {
  return request<AuthSession>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function login(input: {
  email: string;
  password: string;
  remember: boolean;
}): Promise<AuthSession> {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getCurrentSession(token: string): Promise<Omit<AuthSession, 'token'>> {
  return request<Omit<AuthSession, 'token'>>('/auth/me', { token });
}

export function logout(token: string): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST', token });
}
