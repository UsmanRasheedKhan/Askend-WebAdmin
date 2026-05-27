'use client'

import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSurveyDetail, useSurveyResponses } from '@/hooks/useQueries'
import { formatDate } from '@/utils'
import { AlertCircle, Download, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function SurveyResponsesPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const surveyId = params.id
  const { data: survey, isLoading: surveyLoading } = useSurveyDetail(surveyId || '')
  const { data: responses, isLoading: responsesLoading } = useSurveyResponses(surveyId)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredResponses = responses?.filter((resp) =>
    (resp.responder_name || 'Anonymous User').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resp.user_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const targetResponses = survey.target_responses || 1 // Avoid division by zero
  const totalCollected = responses?.length || 0
  const completionRate = Math.round((totalCollected / targetResponses) * 100)

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
          <h1 className="text-3xl font-bold tracking-tight">Survey Responses</h1>
          <p className="text-muted-foreground">{survey.title}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Responses</div>
              <div className="text-3xl font-bold mt-2">{responses?.length || 0}</div>
              <div className="text-xs text-muted-foreground mt-2">out of {survey.target_responses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Completion Rate</div>
              <div className="text-3xl font-bold mt-2">{completionRate}%</div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Remaining</div>
              <div className="text-3xl font-bold mt-2">{Math.max(0, survey.target_responses - (responses?.length || 0))}</div>
              <div className="text-xs text-muted-foreground mt-2">responses needed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Average Time</div>
              <div className="text-2xl font-bold mt-2">
                {responses && responses.length > 0
                  ? Math.round(
                      responses.reduce((sum, r) => sum + (r.time_taken_seconds || 0), 0) / responses.length / 60
                    )
                  : 0}
              </div>
              <div className="text-xs text-muted-foreground mt-2">minutes per response</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground">Search Responder</label>
                <Input
                  placeholder="Search by name or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Responses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Responses</CardTitle>
            <CardDescription>
              Showing {filteredResponses.length} of {responses?.length || 0} responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {responsesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin">
                  <div className="h-8 w-8 rounded-full border-4 border-muted border-t-orange-500" />
                </div>
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {responses?.length === 0 ? 'No responses yet.' : 'No matching responses found.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Responder</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Completed At</TableHead>
                      <TableHead>Time Taken</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="font-medium">
                          {response.responder_name || 'Anonymous User'}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {response.user_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-sm">
                          {response.completed_at ? formatDate(response.completed_at) : formatDate(response.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {response.time_taken_seconds
                            ? `${Math.round(response.time_taken_seconds / 60)} min`
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => alert('Response details: ' + JSON.stringify(response.response_data, null, 2))}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
