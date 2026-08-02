'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, clearToken, type JwtPayload } from '@/lib/auth';
import { useCurrentUser } from '@/lib/use-current-user';

// Two-layer check, deliberately combining both tools from this step:
// 1. Fast local JWT decode (Redux/localStorage) — avoids a network round-trip
//    and a flash of redirect before we even know if a token exists at all.
// 2. useCurrentUser() (TanStack Query) — actually asks the backend to confirm
//    the token is still valid server-side. A token can look unexpired locally
//    but still be rejected server-side (e.g. the secret rotated); only the
//    server call is authoritative.
export function ProtectedRoute({ children }: { children: (user: JwtPayload) => React.ReactNode }) {
  const router = useRouter();
  const [localUser, setLocalUser] = useState<JwtPayload | null | undefined>(undefined);
  const { isError } = useCurrentUser();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    setLocalUser(currentUser);
  }, [router]);

  useEffect(() => {
    if (isError) {
      clearToken();
      router.replace('/login');
    }
  }, [isError, router]);

  if (localUser === undefined) {
    return <div className="flex flex-1 items-center justify-center">Loading...</div>;
  }
  if (localUser === null) {
    return null; // redirect is already in flight
  }

  return <>{children(localUser)}</>;
}
