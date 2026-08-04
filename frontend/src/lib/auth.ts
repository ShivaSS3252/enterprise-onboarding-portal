import { jwtDecode } from 'jwt-decode';

// Mirrors the backend's JwtPayload (backend/src/auth/jwt-payload.interface.ts).
export interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  iat: number;
  exp: number;
}

export const TOKEN_KEY = 'access_token';

// `localStorage` only exists in the browser — but even a page made entirely
// of Client Components is still prerendered once on the server at build time
// to produce its initial HTML, and that server pass has no `window`/`localStorage`
// global at all. The `typeof window !== 'undefined'` check is what tells these
// functions "we're actually in the browser" before touching it.
export function saveToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  // Also written as a plain (non-httpOnly) cookie so Server Components can read
  // it via next/headers `cookies()` for SSR data fetching. This is NOT more secure
  // than localStorage — still readable by any client-side script — it exists
  // purely to bridge the token across to the server render. A true httpOnly
  // cookie would require the backend (or a Next.js Route Handler acting as a
  // Backend-for-Frontend) to set it via a Set-Cookie response header instead.
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
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
