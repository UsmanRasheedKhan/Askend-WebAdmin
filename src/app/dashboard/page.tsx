'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useDashboardAnalytics, useDashboardStats, usePlatformSettings } from '@/hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, AlertCircle, TrendingUp, CreditCard, LogOut } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatNumber } from '@/utils';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: analyticsData, isLoading: analyticsLoading } = useDashboardAnalytics();
  const { data: settings } = usePlatformSettings();

  const userGrowthData = analyticsData?.userGrowthData ?? [];
  const revenueData = analyticsData?.revenueData ?? [];

  if (statsLoading || analyticsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin">
            <div className="h-8 w-8 rounded-full border-4 border-muted border-t-orange-500" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Key Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={formatNumber(stats?.total_users || 0)}
            icon={<Users className="h-4 w-4" />}
            trend={stats?.todays_signups ?? 0}
            href="/admin/users"
          />
          <StatCard
            title="Active Surveys"
            value={formatNumber(stats?.active_surveys || 0)}
            icon={<FileText className="h-4 w-4" />}
            trend={stats?.todays_surveys ?? 0}
            href="/admin/surveys"
          />
          <StatCard
            title="Pending Reports"
            value={formatNumber(stats?.pending_reports || 0)}
            icon={<AlertCircle className="h-4 w-4" />}
            trend={stats?.pending_reports ? -5 : 0}
            href="/admin/reports"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.total_revenue || 0, settings?.currency)}
            icon={<TrendingUp className="h-4 w-4" />}
            trend={8}
            href="/admin/payments"
          />
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Creators"
            value={formatNumber(stats?.total_creators || 0)}
            description="Active survey creators"
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            title="Fillers"
            value={formatNumber(stats?.total_fillers || 0)}
            description="Survey respondents"
            icon={<Users className="h-4 w-4" />}
          />
          <StatCard
            title="Blocked Users"
            value={formatNumber(stats?.blocked_users || 0)}
            description="Currently blocked"
            icon={<AlertCircle className="h-4 w-4" />}
          />
          <StatCard
            title="Pending Withdrawals"
            value={formatNumber(stats?.withdrawals_pending || 0)}
            description="Pending payouts"
            icon={<LogOut className="h-4 w-4" />}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Growth (30 Days)</CardTitle>
              <CardDescription>Total new users registered</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#f97316" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Daily revenue this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
            <CardDescription>Latest counts and platform activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 last:border-b-0">
                <div>
                  <p className="text-sm font-medium">{stats?.todays_signups ?? 0} new users registered today</p>
                  <p className="text-xs text-muted-foreground">Users joined today</p>
                </div>
                <span className="text-xs text-muted-foreground">Updated now</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3 last:border-b-0">
                <div>
                  <p className="text-sm font-medium">{stats?.pending_reports ?? 0} pending reports</p>
                  <p className="text-xs text-muted-foreground">Reports requiring review</p>
                </div>
                <span className="text-xs text-muted-foreground">Updated now</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3 last:border-b-0">
                <div>
                  <p className="text-sm font-medium">{stats?.active_surveys ?? 0} surveys currently published</p>
                  <p className="text-xs text-muted-foreground">Live survey count</p>
                </div>
                <span className="text-xs text-muted-foreground">Updated now</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3 last:border-b-0">
                <div>
                  <p className="text-sm font-medium">{stats?.withdrawals_pending ?? 0} pending payout requests</p>
                  <p className="text-xs text-muted-foreground">Pending withdrawal activity</p>
                </div>
                <span className="text-xs text-muted-foreground">Updated now</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
