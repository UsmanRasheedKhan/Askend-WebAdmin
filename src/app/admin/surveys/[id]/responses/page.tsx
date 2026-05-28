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
import { useSurveyDetail, useSurveyResponses, useSurveyQuestions } from '@/hooks/useQueries'
import { formatDate } from '@/utils'
import { AlertCircle, Download, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'

export default function SurveyResponsesPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const surveyId = params.id
  const { data: survey, isLoading: surveyLoading, error: surveyError } = useSurveyDetail(surveyId || '')
  const { data: responses, isLoading: responsesLoading } = useSurveyResponses(surveyId)
  const { data: questions = [] } = useSurveyQuestions(surveyId)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredResponses = responses?.filter((resp) =>
    (resp.responder_name || 'Anonymous User').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resp.user_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const targetResponses = Number(survey?.target_responses) || 0
  const totalCollected = responses?.length || 0
  const completionRate = targetResponses > 0 ? Math.round((totalCollected / targetResponses) * 100) : 0

  const [openResponse, setOpenResponse] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState<any>(null)

  const questionMap = useMemo(() => {
    const map = new Map<string, string>();
    questions.forEach((question: any, index: number) => {
      const idKey = question?.id ? String(question.id) : '';
      const text = question?.question_text || `Question ${index + 1}`;
      if (idKey) map.set(idKey, text);
      if (question?.question_text) map.set(String(question.question_text), question.question_text);
    });
    return map;
  }, [questions]);

  const selectedResponseEntries = useMemo(() => {
    if (!selectedResponse) return [] as Array<[string, any]>;
    let data = selectedResponse.response_data;

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return [['Response', data]];
      }
    }

    if (Array.isArray(data)) {
      return data.map((value, index) => [String(index + 1), value]);
    }

    if (data && typeof data === 'object') {
      return Object.entries(data);
    }

    return [['Response', data]];
  }, [selectedResponse]);

  const formatAnswerValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      if ('answer' in value) return String((value as any).answer ?? '');
      if ('value' in value) return String((value as any).value ?? '');
      return JSON.stringify(value);
    }
    return String(value);
  };

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

  if (surveyError) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">
                {surveyError instanceof Error ? surveyError.message : 'Unable to load survey.'}
              </p>
            </div>
          </CardContent>
        </Card>
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
              <div className="text-xs text-muted-foreground mt-2">out of {Number(survey?.target_responses) || 0}</div>
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
              <div className="text-3xl font-bold mt-2">{Math.max(0, (Number(survey?.target_responses) || 0) - (responses?.length || 0))}</div>
              <div className="text-xs text-muted-foreground mt-2">responses needed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Average Time</div>
              <div className="text-2xl font-bold mt-2">
                {responses && responses.length > 0
                  ? Math.round(
                      responses.reduce((sum, r) => sum + (Number(r.time_taken_seconds) || 0), 0) / responses.length / 60
                    ) || 0
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
                            onClick={() => { setSelectedResponse(response); setOpenResponse(true); }}
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
      {/* Response Details Dialog */}
      <Dialog open={openResponse} onOpenChange={setOpenResponse}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
            <DialogDescription>
              Detailed view of the selected response
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {selectedResponse ? (
              <div className="text-sm">
                <div className="font-medium">Responder</div>
                <div className="text-muted-foreground mb-2">{selectedResponse.responder_name || 'Anonymous'}</div>

                <div className="font-medium">Submitted At</div>
                <div className="text-muted-foreground mb-2">{selectedResponse.completed_at ? formatDate(selectedResponse.completed_at) : formatDate(selectedResponse.created_at)}</div>

                <div className="font-medium">Answers</div>
                <div className="mt-2 space-y-2">
                  {selectedResponseEntries.length > 0 ? (
                    selectedResponseEntries.map(([key, value], index) => {
                      const label = questionMap.get(String(key)) || questionMap.get(String(key).trim()) || String(key || `Answer ${index + 1}`);
                      return (
                        <div key={`${key}-${index}`} className="p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground">{label}</div>
                          <div className="text-sm font-medium">{formatAnswerValue(value)}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground">No response data available.</div>
                  )}
                </div>
              </div>
            ) : (
              <div>No response selected.</div>
            )}
          </div>
          <DialogFooter>
            <DialogClose />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
