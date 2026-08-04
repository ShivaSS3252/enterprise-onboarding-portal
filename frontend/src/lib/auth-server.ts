import { cookies } from 'next/headers';
import { TOKEN_KEY, decodeToken, type JwtPayload } from './auth';

// Server-only counterpart to lib/auth.ts's client-side token helpers.
// This file must never be imported from a Client Component — `next/headers`
// only works during server rendering.
export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_KEY)?.value ?? null;
}

export async function getServerUser(): Promise<JwtPayload | null> {
  const token = await getServerToken();
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;
  if (payload.exp * 1000 <= Date.now()) return null;

  return payload;
}
