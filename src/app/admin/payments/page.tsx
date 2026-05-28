'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePayments, usePlatformSettings } from '@/hooks/useQueries';
import { formatDate, formatCurrency } from '@/utils';
import { Search } from 'lucide-react';

export default function PaymentsPage() {
  const { data, isLoading } = usePayments({ page: 1, limit: 10 });
  const { data: settings } = usePlatformSettings();
  const transactions = data?.transactions || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground">Manage transactions, withdrawals, and revenue.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(data?.totalRevenue || 0, settings?.currency)}</p>
              <p className="text-xs text-muted-foreground">{data?.transactions.length ?? 0} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(data?.pendingWithdrawalsAmount || 0, settings?.currency)}</p>
              <p className="text-xs text-muted-foreground">{data?.pendingWithdrawalsCount ?? 0} pending requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency((data?.totalRevenue || 0) * (settings?.platform_fee || 10) / 100, settings?.currency)}</p>
              <p className="text-xs text-muted-foreground">{settings?.platform_fee || 10}% of total completed revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin">
                  <div className="h-8 w-8 rounded-full border-4 border-muted border-t-orange-500" />
                </div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No payments or transactions have been recorded yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{(tx as any).creator_name || tx.user_id}</TableCell>
                      <TableCell>{formatCurrency(tx.amount, settings?.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'credit' ? 'default' : 'outline'}>
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'outline'}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(tx.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
