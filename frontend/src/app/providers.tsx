'use client';

import { useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/store/store';

export function Providers({ children }: { children: React.ReactNode }) {
  // Created inside the component (not at module scope) so each user session
  // gets its own QueryClient instance — a module-level client would leak
  // cached data across different users' requests in an SSR context.
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ReduxProvider>
  );
}
