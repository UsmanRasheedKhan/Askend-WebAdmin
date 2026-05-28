'use client';

import { useAuthStore } from '@/store/auth';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAdminRealtime, usePlatformSettings } from '@/hooks/useQueries';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, initializeAuth, isLoading } = useAuthStore();
  const router = useRouter();
  const { data: settings } = usePlatformSettings();

  useAdminRealtime(!isLoading && isAuthenticated);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (settings?.platform_name) {
      document.title = `${settings.platform_name} Admin`;
    }
  }, [settings?.platform_name]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin">
          <div className="h-8 w-8 rounded-full border-4 border-muted border-t-orange-500" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
