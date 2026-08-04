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

// Central fetch wrapper: attaches the JWT to every request, and normalizes
// error responses into a typed ApiError instead of every caller having to
// check response.ok manually.
//
// `tokenOverride` lets Server Components pass a token read from a cookie
// (via next/headers) — getToken() itself only ever works in the browser,
// since it reads localStorage.
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  tokenOverride?: string | null,
): Promise<T> {
  const token = tokenOverride ?? getToken();
  // FormData bodies (file uploads) must NOT get a manual Content-Type — the
  // browser needs to set its own multipart boundary, which we'd otherwise
  // override and break.
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

export interface BasicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'COMPLETED';
  createdAt: string;
  completedAt: string | null;
  assignedTo: BasicUser;
  createdBy: BasicUser;
}

export interface AppUser extends BasicUser {
  role: 'ADMIN' | 'EMPLOYEE';
  createdAt: string;
}

// Each accepts an optional token override so the same function works from
// both a Server Component (passing a cookie-derived token) and a Client
// Component (omitting it, falling back to localStorage inside apiFetch).
export function getAllTasks(token?: string | null) {
  return apiFetch<OnboardingTask[]>('/onboarding', {}, token);
}

export function getAllUsers(token?: string | null) {
  return apiFetch<AppUser[]>('/users', {}, token);
}

export function createTask(dto: { title: string; description?: string; assignedToId: string }) {
  return apiFetch<OnboardingTask>('/onboarding', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function deleteTask(id: string) {
  return apiFetch<void>(`/onboarding/${id}`, { method: 'DELETE' });
}

export function getMyTasks(token?: string | null) {
  return apiFetch<OnboardingTask[]>('/onboarding/mine', {}, token);
}

export function completeTask(id: string) {
  return apiFetch<OnboardingTask>(`/onboarding/${id}/complete`, { method: 'PATCH' });
}

export interface AppDocument {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  taskId: string | null;
}

export function getMyDocuments(token?: string | null) {
  return apiFetch<AppDocument[]>('/documents/mine', {}, token);
}

export function uploadDocument(file: File, taskId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (taskId) formData.append('taskId', taskId);

  return apiFetch<AppDocument>('/documents', {
    method: 'POST',
    body: formData,
  });
}

export function deleteDocument(id: string) {
  return apiFetch<void>(`/documents/${id}`, { method: 'DELETE' });
}
