'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, type JwtPayload } from '@/lib/auth';

// Wraps any page that requires a logged-in user. The auth check can only run
// client-side (it reads localStorage), so on first render we don't yet know
// if the user is authenticated — hence the loading state, to avoid briefly
// flashing protected content before a redirect happens.
export function ProtectedRoute({ children }: { children: (user: JwtPayload) => React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<JwtPayload | null | undefined>(undefined);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  if (user === undefined) {
    return <div className="flex flex-1 items-center justify-center">Loading...</div>;
  }
  if (user === null) {
    return null; // redirect is already in flight
  }

  return <>{children(user)}</>;
}
