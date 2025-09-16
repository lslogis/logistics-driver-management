'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes (longer for better performance)
            gcTime: 30 * 60 * 1000, // 30 minutes (keep data longer)
            retry: 2, // Fewer retries for faster failure detection
            refetchOnWindowFocus: false,
            refetchOnReconnect: true, // Refetch when network reconnects
            refetchIntervalInBackground: false, // Don't refetch in background
          },
          mutations: {
            retry: 1,
            networkMode: 'offlineFirst', // Better offline handling
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}