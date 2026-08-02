import { getToken, type JwtPayload } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Central fetch wrapper: attaches the JWT (if present) to every request,
// and normalizes error responses into a typed ApiError instead of every
// caller having to check response.ok manually.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, body.message ?? 'Request failed');
  }

  // 204 No Content responses (e.g. DELETE) have no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; role: 'ADMIN' | 'EMPLOYEE' };
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(dto: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

// The backend's GET /auth/me returns the decoded JWT payload verbatim
// (see backend AuthController.me), so it matches JwtPayload exactly.
// Hits the real backend to confirm the token is still valid server-side —
// deliberately not just trusting the locally-decoded JWT's exp claim.
export function getMe() {
  return apiFetch<JwtPayload>('/auth/me');
}
