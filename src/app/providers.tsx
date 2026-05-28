'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
