'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { clearToken } from '@/lib/auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearUser } from '@/store/slices/auth-slice';

// Placeholder only — Step 13 replaces this with a real Admin dashboard and
// Step 14 with a real Employee dashboard (routed by role). This page exists
// solely to verify the login -> protected route -> JWT flow end-to-end now.
export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  // Reading from Redux here, not from a prop or a fresh localStorage decode —
  // this is the actual payoff of Step 12: any component in the tree can read
  // "who is logged in" synchronously, without threading it through props.
  const reduxUser = useAppSelector((state) => state.auth.user);

  function handleLogout() {
    clearToken();
    dispatch(clearUser());
    router.push('/login');
  }

  return (
    <ProtectedRoute>
      {(user) => (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-semibold">Welcome, {user.email}</h1>
          <p className="text-zinc-500">Role: {user.role}</p>
          <p className="text-xs text-zinc-400">
            (Redux state says: {reduxUser?.email ?? 'not yet populated'})
          </p>
          <button onClick={handleLogout} className="rounded bg-zinc-900 px-4 py-2 text-white">
            Log out
          </button>
        </div>
      )}
    </ProtectedRoute>
  );
}
