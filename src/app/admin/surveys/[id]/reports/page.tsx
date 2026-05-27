'use client'

import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSurveyDetail, useSurveyReports, useReportNotifications } from '@/hooks/useQueries'
import { formatDate } from '@/utils'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function SurveyReportsPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const surveyId = params.id
  const { data: survey, isLoading: surveyLoading } = useSurveyDetail(surveyId || '')
  const { data: reports, isLoading: reportsLoading } = useSurveyReports(surveyId)
  const { data: reportNotifications, isLoading: notificationsLoading } = useReportNotifications()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'dismissed' | 'action_taken'>('all')

  // Get notifications for this survey
  const surveyNotifications = reportNotifications?.data?.filter((notif) => notif.survey_id === surveyId) || []

  const filteredNotifications = surveyNotifications.filter((notif) => {
    const matchesSearch =
      notif.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.reporter_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || notif.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const pendingCount = surveyNotifications.filter((n) => n.status === 'pending').length
  const reviewedCount = surveyNotifications.filter((n) => n.status === 'reviewed').length
  const actionTakenCount = surveyNotifications.filter((n) => n.status === 'action_taken').length

  if (surveyLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin">
            <div className="h-8 w-8 rounded-full border-4 border-muted border-t-orange-500" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!survey) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">Survey not found.</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
            ← Back to Survey
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Survey Reports</h1>
          <p className="text-muted-foreground">{survey.title}</p>
        </div>

        {/* Alert if high reports */}
        {pendingCount > 5 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800 font-medium">
                  This survey has {pendingCount} pending reports. Consider taking action.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Reports</div>
              <div className="text-3xl font-bold mt-2">{surveyNotifications.length}</div>
              <div className="text-xs text-muted-foreground mt-2">user reports</div>
            </CardContent>
          </Card>

          <Card className={pendingCount > 0 ? 'border-red-300 bg-red-50' : ''}>
            <CardContent className="pt-6">
              <div className={`text-sm ${pendingCount > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                Pending
              </div>
              <div className="text-3xl font-bold mt-2">{pendingCount}</div>
              <div className="text-xs text-muted-foreground mt-2">awaiting review</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Reviewed</div>
              <div className="text-3xl font-bold mt-2">{reviewedCount}</div>
              <div className="text-xs text-muted-foreground mt-2">processed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Action Taken</div>
              <div className="text-3xl font-bold mt-2">{actionTakenCount}</div>
              <div className="text-xs text-muted-foreground mt-2">resolved</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground">Search Reports</label>
                <Input
                  placeholder="Search by reason, reporter ID, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="action_taken">Action Taken</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
            <CardDescription>
              Showing {filteredNotifications.length} of {surveyNotifications.length} reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin">
                  <div className="h-8 w-8 rounded-full border-4 border-muted border-t-orange-500" />
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {surveyNotifications.length === 0 ? 'No reports for this survey yet.' : 'No matching reports found.'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card key={notification.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{notification.reason}</h3>
                            <Badge
                              variant={
                                notification.status === 'pending'
                                  ? 'destructive'
                                  : notification.status === 'action_taken'
                                    ? 'default'
                                    : 'secondary'
                              }
                            >
                              {notification.status.replace('_', ' ').charAt(0).toUpperCase() +
                                notification.status.replace('_', ' ').slice(1)}
                            </Badge>
                          </div>
                          {notification.description && (
                            <p className="text-sm text-muted-foreground mb-3">{notification.description}</p>
                          )}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Reported By:</span>
                              <p className="font-mono text-xs">{notification.reporter_id?.slice(0, 12)}...</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Reported At:</span>
                              <p className="text-sm">{formatDate(notification.created_at)}</p>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
