'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils';
import { NAVIGATION_ITEMS } from '@/constants';
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertCircle,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { usePlatformSettings } from '@/hooks/useQueries';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  FileText,
  AlertCircle,
  CreditCard,
  Bell,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { data: settings } = usePlatformSettings();
  const platformName = settings?.platform_name || 'Survey Admin';
  const platformInitials = platformName
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col gap-4 border-r bg-background px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
          <span className="text-sm font-bold text-white">{platformInitials || 'SA'}</span>
        </div>
        <h1 className="text-lg font-bold text-foreground">{platformName}</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {NAVIGATION_ITEMS.map((item) => {
          const IconComponent = iconMap[item.icon as string];
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {IconComponent && <IconComponent className="h-4 w-4" />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-orange-500 text-white">
                    {user?.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-xs">
                  <span className="font-medium text-foreground">{user?.full_name}</span>
                  <span className="text-muted-foreground">{user?.role}</span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4" />
            </>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Change Password</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
