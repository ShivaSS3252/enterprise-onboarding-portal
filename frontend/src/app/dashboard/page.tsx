import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth-server';

// Thin role router: the single landing point login/register redirect to,
// which then dispatches to the real role-specific dashboard. Replaces the
// generic placeholder from Steps 11/12, now that both real dashboards exist.
export default async function DashboardRouterPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  redirect(user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard');
}
