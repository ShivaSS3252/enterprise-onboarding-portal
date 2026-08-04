import { redirect } from 'next/navigation';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getServerUser, getServerToken } from '@/lib/auth-server';
import { getMyTasks, getMyDocuments } from '@/lib/api';
import { DashboardClient } from './dashboard-client';

// Same SSR + cookie + TanStack Query hydration pattern as the Admin dashboard
// (Step 13) — real server-side route protection, and data already populated
// in the HTML on first paint rather than fetched after the page mounts.
export default async function EmployeeDashboardPage() {
  const user = await getServerUser();
  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'EMPLOYEE') {
    redirect('/admin/dashboard');
  }

  const token = await getServerToken();

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ['myTasks'], queryFn: () => getMyTasks(token) }),
    queryClient.prefetchQuery({ queryKey: ['myDocuments'], queryFn: () => getMyDocuments(token) }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient employeeEmail={user.email} />
    </HydrationBoundary>
  );
}
