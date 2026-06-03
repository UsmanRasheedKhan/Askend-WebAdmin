'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { usePlatformSettings, useUpdateUserMutation, useUserDetail } from '@/hooks/useQueries';
import { SurveyUser } from '@/types';
import { formatCurrency, formatDate } from '@/utils';
import { toast } from 'sonner';

export default function UserProfilePage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const userId = params.id || '';
  const { data: user, isLoading, error } = useUserDetail(userId);
  const { data: settings } = usePlatformSettings();
  const updateUserMutation = useUpdateUserMutation();

  useEffect(() => {
    if (!user || user.status !== 'suspended' || !user.suspension_end_date) return;
    const endDate = new Date(user.suspension_end_date);
    if (Number.isNaN(endDate.getTime())) return;

    if (endDate <= new Date()) {
      const targetId = (user as any)?.user_id || user.id || userId;
      updateUserMutation.mutate({
        userId: String(targetId),
        matchField: 'user_id',
        data: { status: 'active', suspension_end_date: null },
      });
    }
  }, [user, userId, updateUserMutation]);

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20',
    blocked: 'bg-red-100 text-red-800 dark:bg-red-900/20',
    suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20',
    banned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20',
  };

  const statusValue = user?.status || 'active';
  const statusLabel = statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
  const isBlocked = statusValue === 'blocked';
  const initials = (user?.full_name || 'User')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = user?.user_role === 'creator' ? 'Creator' : 'Filler';

  const handleStatusChange = (status: SurveyUser['status']) => {
    if (!userId) {
      toast.error('User id is missing.');
      return;
    }

    const now = new Date();
    const suspensionEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const updateData: Partial<SurveyUser> = {
      status,
    };

    if (status === 'suspended') {
      updateData.suspension_end_date = suspensionEnd.toISOString();
    } else {
      updateData.suspension_end_date = null;
    }

    const targetId = (user as any)?.user_id || user?.id || userId;
    updateUserMutation.mutate(
      { userId: String(targetId), matchField: 'user_id', data: updateData },
      {
        onSuccess: () => {
          toast.success(`User status updated to ${status}`);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Unable to update user status');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin">
            <div className="h-8 w-8 rounded-full border-4 border-muted border-t-orange-500" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">
                {error instanceof Error ? error.message : 'Unable to load user.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">User not found.</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
              {'<-'} Back to Users
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
            <p className="text-muted-foreground">Review user details and moderation actions.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[statusValue] || statusColors.active}>{statusLabel}</Badge>
            <Badge variant="outline">{roleLabel}</Badge>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{user.full_name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">ID: {(user as any).user_id || user.id}</p>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-4 text-sm md:justify-end">
              <div>
                <p className="text-muted-foreground">Wallet Balance</p>
                <p className="font-medium">{formatCurrency(user.wallet_balance, settings?.currency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Joined</p>
                <p className="font-medium">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Surveys Created</p>
                <p className="font-medium">{user.total_surveys_created}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Responses Filled</p>
                <p className="font-medium">{user.total_responses_filled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="text-base font-medium">{roleLabel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-base font-medium">{statusLabel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-base font-medium">{user.total_reports}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suspended Until</p>
                <p className="text-base font-medium">
                  {user.suspension_end_date ? formatDate(user.suspension_end_date) : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                {isBlocked ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatusChange('active')}
                    disabled={updateUserMutation.isPending}
                  >
                    Restore User
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleStatusChange('blocked')}
                      disabled={updateUserMutation.isPending}
                    >
                      Block User
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleStatusChange('suspended')}
                      disabled={updateUserMutation.isPending}
                    >
                      Suspend 7 Days
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
