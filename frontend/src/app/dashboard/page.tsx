'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { clearToken } from '@/lib/auth';

// Placeholder only — Step 13 replaces this with a real Admin dashboard and
// Step 14 with a real Employee dashboard (routed by role). This page exists
// solely to verify the login -> protected route -> JWT flow end-to-end now.
export default function DashboardPage() {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  return (
    <ProtectedRoute>
      {(user) => (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-semibold">Welcome, {user.email}</h1>
          <p className="text-zinc-500">Role: {user.role}</p>
          <button onClick={handleLogout} className="rounded bg-zinc-900 px-4 py-2 text-white">
            Log out
          </button>
        </div>
      )}
    </ProtectedRoute>
  );
}
