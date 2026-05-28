'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { usePlatformSettings, useReports, useUpdateReportStatusMutation } from '@/hooks/useQueries';
import { formatDate } from '@/utils';
import { MoreVertical, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PAGINATION_LIMITS } from '@/constants';

export default function ReportsPage() {
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const { data, isLoading } = useReports({ page, limit: PAGINATION_LIMITS.DEFAULT });
  const { data: settings } = usePlatformSettings();
  const updateReportStatusMutation = useUpdateReportStatusMutation();

  const reportThreshold = settings?.report_threshold ?? 25;
  const suspensionThreshold = settings?.suspension_threshold ?? 3;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20',
    reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20',
    dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20',
    action_taken: 'bg-green-100 text-green-800 dark:bg-green-900/20',
  };

  const typeColors: Record<string, string> = {
    survey: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20',
    user: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Management</h1>
          <p className="text-muted-foreground">Review and manage user reports and moderation.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Moderation Rules</CardTitle>
            <CardDescription>
              Alerts trigger after {reportThreshold} reports. Auto-suspension triggers after {suspensionThreshold} downed surveys.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Button variant={page === 1 ? 'default' : 'outline'}>Pending</Button>
            <Button variant="outline">Reviewed</Button>
            <Button variant="outline">Dismissed</Button>
            <Button variant="outline">Action Taken</Button>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
            <CardDescription>
              Total: {data?.total || 0} reports
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
              <div className="py-12 text-center text-muted-foreground">No reports were found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Target</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data?.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.target_id}</TableCell>
                        <TableCell>
                          <Badge className={typeColors[report.report_type]}>
                            {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{report.reason}</TableCell>
                        <TableCell className="text-sm">User</TableCell>
                        <TableCell>
                          <Badge className={statusColors[report.status]}>
                            {report.status.replace(/_/g, ' ').charAt(0).toUpperCase() + report.status.slice(1).replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(report.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedReport(report)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast(`Warning sent for report ${report.id}`)}>
                                Send Warning
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  updateReportStatusMutation.mutate(
                                    { reportId: report.id, status: 'action_taken' },
                                    {
                                      onSuccess: () => toast.success('Report marked action taken'),
                                      onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to update report'),
                                    }
                                  )
                                }
                              >
                                Down Content
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-orange-600"
                                onClick={() =>
                                  updateReportStatusMutation.mutate(
                                    { reportId: report.id, status: 'reviewed' },
                                    {
                                      onSuccess: () => toast.success('Report marked as reviewed'),
                                      onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to update report'),
                                    }
                                  )
                                }
                              >
                                Review Report
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-gray-600"
                                onClick={() =>
                                  updateReportStatusMutation.mutate(
                                    { reportId: report.id, status: 'dismissed' },
                                    {
                                      onSuccess: () => toast.success('Report dismissed'),
                                      onError: (error) => toast.error(error instanceof Error ? error.message : 'Unable to update report'),
                                    }
                                  )
                                }
                              >
                                Dismiss
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        {/* Report Details Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
              <DialogDescription>
                Review and take action on this report
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Report ID</p>
                    <p className="text-sm text-muted-foreground">{selectedReport.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <Badge className={typeColors[selectedReport.report_type]}>
                      {selectedReport.report_type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge className={statusColors[selectedReport.status]}>
                      {selectedReport.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedReport.created_at)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Reason</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.reason}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                </div>

                <div className="flex gap-2">
                  <Button size="sm">Send Warning</Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    Suspend Account
                  </Button>
                  <Button size="sm" variant="outline">
                    Dismiss Report
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
