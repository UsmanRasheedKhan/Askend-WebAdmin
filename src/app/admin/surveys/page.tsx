'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { useSurveys, useDeleteSurveyMutation, useDownSurveyMutation, useRestoreSurveyMutation, usePlatformSettings } from '@/hooks/useQueries';
import { useRouter } from 'next/navigation';
import { getSurveyReward } from '@/utils';
import { formatDate, formatCurrency, truncate } from '@/utils';
import { MoreVertical, Search } from 'lucide-react';
import { PAGINATION_LIMITS } from '@/constants';
import { toast } from 'sonner';

export default function SurveysPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useSurveys({ 
    page, 
    limit: PAGINATION_LIMITS.DEFAULT,
    search: search || undefined
  });
  const { data: settings } = usePlatformSettings();
  const downSurveyMutation = useDownSurveyMutation();
  const restoreSurveyMutation = useRestoreSurveyMutation();
  const deleteSurveyMutation = useDeleteSurveyMutation();
  const router = useRouter();

  const statusColors: Record<string, string> = {
    draft: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20',
    published: 'bg-green-100 text-green-800 dark:bg-green-900/20',
    downed: 'bg-red-100 text-red-800 dark:bg-red-900/20',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Survey Management</h1>
          <p className="text-muted-foreground">Manage all surveys on the platform.</p>
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
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">All Statuses</Button>
          </CardContent>
        </Card>

        {/* Surveys Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Surveys</CardTitle>
            <CardDescription>
              Total: {data?.total || 0} surveys
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
              <div className="py-12 text-center text-muted-foreground">No surveys match your criteria.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responses</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Reports</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data?.map((survey) => {
                      const responsesCollected = (survey as any).responses_colleted ?? (survey as any).responses_count ?? 0;
                      const totalResponses = (survey as any).total_responses ?? survey.target_responses ?? 0;

                      return (
                      <TableRow key={survey.id}>
                        <TableCell className="font-medium max-w-xs">
                          {truncate(survey.title, 40)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {survey.creator_name && ((survey as any).user_id || (survey as any).creator_id) ? (
                            <Link
                              href={`/admin/users/${(survey as any).user_id || (survey as any).creator_id}`}
                              className="text-blue-600 hover:text-blue-800 underline"
                              title={survey.creator_name}
                            >
                              {truncate(survey.creator_name, 30)}
                            </Link>
                          ) : (
                            truncate(survey.creator_name || 'Unknown', 30)
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[survey.status]}>
                            {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {responsesCollected} / {totalResponses}
                        </TableCell>
                        <TableCell>{formatCurrency(getSurveyReward(survey), settings?.currency)}</TableCell>
                        <TableCell className="text-sm">
                          {survey.created_at ? formatDate(survey.created_at) : '-'}
                        </TableCell>
                        <TableCell className="text-center">{survey.total_reports}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/admin/surveys/${survey.id}`)}>
                                View Survey
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/surveys/${survey.id}/responses`)}>
                                View Responses
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/surveys/${survey.id}/analytics`)}>
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/surveys/${survey.id}/reports`)}>
                                View Reports
                              </DropdownMenuItem>
                              {survey.status !== 'downed' && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() =>
                                    downSurveyMutation.mutate(survey.id, {
                                      onSuccess: () => toast.success('Survey has been taken down.'),
                                      onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to down survey'),
                                    })
                                  }
                                >
                                  Down Survey
                                </DropdownMenuItem>
                              )}
                              {survey.status === 'downed' && (
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() =>
                                    restoreSurveyMutation.mutate(survey.id, {
                                      onSuccess: () => toast.success('Survey restored to published status.'),
                                      onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to restore survey'),
                                    })
                                  }
                                >
                                  Restore Survey
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  deleteSurveyMutation.mutate(survey.id, {
                                    onSuccess: () => toast.success('Survey deleted successfully.'),
                                    onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to delete survey'),
                                  })
                                }
                              >
                                Delete Survey
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )})}
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
