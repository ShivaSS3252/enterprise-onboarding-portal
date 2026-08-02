import { jwtDecode } from 'jwt-decode';

// Mirrors the backend's JwtPayload (backend/src/auth/jwt-payload.interface.ts).
export interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  iat: number;
  exp: number;
}

const TOKEN_KEY = 'access_token';

// localStorage only exists in the browser — every function here must only ever
// run inside a Client Component ('use client'), never during server rendering.
export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

// A token that fails to decode, or whose exp claim is in the past, is unusable.
export function isTokenValid(token: string | null): token is string {
  if (!token) return false;
  const payload = decodeToken(token);
  if (!payload) return false;
  return payload.exp * 1000 > Date.now();
}

export function getCurrentUser(): JwtPayload | null {
  const token = getToken();
  if (!isTokenValid(token)) return null;
  return decodeToken(token);
}
