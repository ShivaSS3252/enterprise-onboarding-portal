import { redirect } from 'next/navigation';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getServerUser, getServerToken } from '@/lib/auth-server';
import { getAllTasks, getAllUsers } from '@/lib/api';
import { DashboardClient } from './dashboard-client';

// A Server Component: this runs entirely on the server, before any HTML is
// sent to the browser. Real server-side route protection — if there's no
// valid ADMIN session, we redirect before rendering anything at all, unlike
// the client-side ProtectedRoute (Step 12), which always renders a brief
// loading state first because it can only check auth after the page loads.
export default async function AdminDashboardPage() {
  const user = await getServerUser();
  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const token = await getServerToken();

  // Prefetch on the server, using the same query keys/functions the client
  // will use — this is what lets the dashboard render already-populated,
  // with zero loading spinner, instead of fetching after the page mounts.
  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ['tasks'], queryFn: () => getAllTasks(token) }),
    queryClient.prefetchQuery({ queryKey: ['users'], queryFn: () => getAllUsers(token) }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient adminEmail={user.email} />
    </HydrationBoundary>
  );
}
