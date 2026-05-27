'use client';

import { useState } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useUsers, useUpdateUserMutation, usePlatformSettings } from '@/hooks/useQueries';
import { SurveyUser } from '@/types';
import { formatDate, formatCurrency } from '@/utils';
import { MoreVertical, Search } from 'lucide-react';
import { PAGINATION_LIMITS } from '@/constants';
import { toast } from 'sonner';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'creator' | 'filler'>('all');
  const { data, isLoading } = useUsers({ page, limit: PAGINATION_LIMITS.DEFAULT, role: roleFilter === 'all' ? undefined : roleFilter });
  const { data: settings } = usePlatformSettings();
  const updateUserMutation = useUpdateUserMutation();

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20',
    blocked: 'bg-red-100 text-red-800 dark:bg-red-900/20',
    suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20',
    banned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20',
  };

  const handleUserStatusChange = async (userId: string, status: SurveyUser['status']) => {
    updateUserMutation.mutate({ userId, data: { status } }, {
      onSuccess: () => {
        toast.success(`User status updated to ${status}`);
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Unable to update user status');
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage and monitor all platform users.</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="rounded-md border px-2 py-1 text-sm"
              >
                <option value="all">All Roles</option>
                <option value="creator">Creators</option>
                <option value="filler">Fillers</option>
              </select>
              <Button variant="outline">Filter</Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Total: {data?.total || 0} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin">
                  <div className="h-8 w-8 rounded-full border-4 border-muted border-t-orange-500" />
                </div>
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No users available at the moment.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Joined</TableHead>
                      {roleFilter === 'creator' && <TableHead>Reports</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.user_role === 'creator' ? 'Creator' : 'Filler'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[user.status]}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(user.wallet_balance, settings?.currency)}</TableCell>
                        <TableCell className="text-sm">{formatDate(user.created_at)}</TableCell>
                        {roleFilter === 'creator' && (
                          <TableCell className="text-center">{user.total_reports}</TableCell>
                        )}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast(`Viewing profile for ${user.full_name}`)}>
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast(`Send message to ${user.full_name}`)}>
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast(`Reviewing reports for ${user.full_name}`)}>
                                View Reports
                              </DropdownMenuItem>
                              {user.status === 'active' && (
                                <>
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleUserStatusChange(user.id, 'blocked')}>
                                    Block User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-orange-600" onClick={() => handleUserStatusChange(user.id, 'suspended')}>
                                    Suspend User
                                  </DropdownMenuItem>
                                </>
                              )}
                              {user.status !== 'active' && (
                                <DropdownMenuItem className="text-green-600" onClick={() => handleUserStatusChange(user.id, 'active')}>
                                  Unblock User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {data && data.total_pages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPage(Math.max(1, page - 1))}
                            className="cursor-pointer"
                          />
                        </PaginationItem>

                        {Array.from({ length: Math.min(5, data.total_pages) }).map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => setPage(i + 1)}
                              isActive={page === i + 1}
                              className="cursor-pointer"
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                            className="cursor-pointer"
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
