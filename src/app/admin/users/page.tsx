'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useRouter, useSearchParams } from 'next/navigation';

type UserRow = SurveyUser & { user_id?: string; total_reports?: number };

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [roleInput, setRoleInput] = useState<'all' | 'creator' | 'filler'>('all');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedRole, setAppliedRole] = useState<'all' | 'creator' | 'filler'>('all');

  useEffect(() => {
    const paramSearch = searchParams.get('search') || '';
    const paramRole = searchParams.get('role') || 'all';

    setSearchInput(paramSearch);
    setAppliedSearch(paramSearch);

    if (paramRole === 'creator' || paramRole === 'filler' || paramRole === 'all') {
      setRoleInput(paramRole);
      setAppliedRole(paramRole);
    }

    setPage(1);
  }, [searchParams]);

  const isFiltering = appliedSearch.trim().length > 0 || appliedRole !== 'all';
  const limit = isFiltering ? Math.max(PAGINATION_LIMITS.LARGE, 200) : PAGINATION_LIMITS.DEFAULT;

  const { data, isLoading, error } = useUsers({ 
    page, 
    limit, 
    role: appliedRole === 'all' ? undefined : appliedRole,
    search: appliedSearch || undefined
  });
  const { data: settings } = usePlatformSettings();
  const updateUserMutation = useUpdateUserMutation();
  const filteredUsers = useMemo(() => {
    const list = (data?.data || []) as UserRow[];
    const query = appliedSearch.trim().toLowerCase();

    return list.filter((user: UserRow) => {
      if (appliedRole !== 'all' && user.user_role !== appliedRole) return false;
      if (!query) return true;

      const haystack = [
        user.full_name,
        user.email,
        (user as any).user_id,
        (user as any).id,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return haystack.some((value) => value.includes(query));
    });
  }, [data, appliedRole, appliedSearch]);

  const handleApplyFilters = () => {
    const trimmedSearch = searchInput.trim();

    setAppliedSearch(trimmedSearch);
    setAppliedRole(roleInput);
    setPage(1);

    const params = new URLSearchParams();
    if (trimmedSearch) params.set('search', trimmedSearch);
    if (roleInput !== 'all') params.set('role', roleInput);

    const queryString = params.toString();
    router.replace(queryString ? `/admin/users?${queryString}` : '/admin/users');
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20',
    blocked: 'bg-red-100 text-red-800 dark:bg-red-900/20',
    suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20',
    banned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20',
  };

  const getUserId = (user: any) => user.user_id || user.id;
  const getUserIdField = (user: any) => {
    if (user.user_id) return 'user_id';
    if (typeof user.id === 'string' && /^[0-9a-f]{8}-/i.test(user.id)) return 'user_id';
    return 'id';
  };

  const handleUserStatusChange = async (user: SurveyUser, status: SurveyUser['status']) => {
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

    updateUserMutation.mutate(
      { userId: getUserId(user), matchField: getUserIdField(user), data: updateData },
      {
        onSuccess: () => {
          toast.success(`User status updated to ${status}`);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Unable to update user status');
        },
      }
    );
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as any)}
                className="rounded-md border px-2 py-1 text-sm"
              >
                <option value="all">All Roles</option>
                <option value="creator">Creators</option>
                <option value="filler">Fillers</option>
              </select>
              <Button variant="outline" onClick={handleApplyFilters}>Filter</Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              {isFiltering ? `Filtered: ${filteredUsers.length} users` : `Total: ${data?.total || 0} users`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin">
                  <div className="h-8 w-8 rounded-full border-4 border-muted border-t-orange-500" />
                </div>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-red-600">
                {error instanceof Error ? error.message : 'Unable to load users.'}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No users available at the moment.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Profession</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Joined</TableHead>
                      {appliedRole === 'creator' && <TableHead>Reports</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: UserRow) => (
                      <TableRow key={getUserId(user)}>
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
                        {appliedRole === 'creator' && (
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
                              <DropdownMenuItem onClick={() => router.push(`/admin/users/${getUserId(user)}`)}>
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast(`Reviewing reports for ${user.full_name}`)}>
                                View Reports
                              </DropdownMenuItem>
                              {user.status === 'active' && (
                                <>
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleUserStatusChange(user, 'blocked')}>
                                    Block User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-orange-600" onClick={() => handleUserStatusChange(user, 'suspended')}>
                                    Suspend User
                                  </DropdownMenuItem>
                                </>
                              )}
                              {user.status !== 'active' && (
                                <DropdownMenuItem className="text-green-600" onClick={() => handleUserStatusChange(user, 'active')}>
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
                {!isFiltering && data && data.total_pages > 1 && (
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
