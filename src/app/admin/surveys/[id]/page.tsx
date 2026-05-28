"use client"

import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSurveyDetail, useSurveyQuestions, useDownSurveyMutation, useDeleteSurveyMutation, useRestoreSurveyMutation, usePlatformSettings } from '@/hooks/useQueries'
import { formatDate, formatCurrency, getSurveyReward } from '@/utils'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Eye, Edit, Trash2, ArrowUp, Copy } from 'lucide-react'

export default function SurveyDetailPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const surveyId = params.id
  const { data: survey, isLoading, error } = useSurveyDetail(surveyId || '')
  const { data: questions } = useSurveyQuestions(surveyId)
  const { data: settings } = usePlatformSettings()
  const downMutation = useDownSurveyMutation()
  const restoreMutation = useRestoreSurveyMutation()
  const deleteMutation = useDeleteSurveyMutation()

  if (isLoading) {
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

  if (error) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">
                {error instanceof Error ? error.message : 'Unable to load survey.'}
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

  const statusColors: Record<string, string> = {
    draft: 'bg-blue-100 text-blue-800',
    published: 'bg-green-100 text-green-800',
    downed: 'bg-red-100 text-red-800',
  }

  const responsesCount = Number((survey as any).responses_count) || 0
  const targetResponsesNum = Number((survey as any).target_responses) || 0
  const questionList = questions && questions.length > 0 ? questions : (survey as any).questions || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                ← Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{survey.title}</h1>
            <p className="text-muted-foreground mt-1">{survey.description}</p>
          </div>
          <Badge className={statusColors[survey.status]}>
            {survey.status === 'published' ? 'Published' : survey.status === 'draft' ? 'Draft' : 'Downed'}
          </Badge>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Responses</div>
              <div className="text-2xl font-bold mt-2">
                {responsesCount}
                <span className="text-lg text-muted-foreground ml-1">/ {survey.target_responses}</span>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width: `${targetResponsesNum > 0 ? Math.round((responsesCount / targetResponsesNum) * 100) : 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Reward per Response</div>
              <div className="text-2xl font-bold mt-2">{formatCurrency(getSurveyReward(survey), settings?.currency)}</div>
              <div className="text-xs text-muted-foreground mt-2">Total reward: {formatCurrency(getSurveyReward(survey) * responsesCount, settings?.currency)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Reports</div>
              <div className="text-2xl font-bold mt-2">{survey.total_reports}</div>
              <Button variant="link" size="sm" className="p-0 mt-2" onClick={() => router.push(`/admin/surveys/${survey.id}/reports`)}>
                View Reports →
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-lg font-semibold mt-2">{formatDate(survey.created_at)}</div>
              {survey.published_at && (
                <div className="text-xs text-muted-foreground mt-2">Published: {formatDate(survey.published_at)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Details and Questions */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Survey Details</TabsTrigger>
            <TabsTrigger value="questions">Questions ({questionList.length || 0})</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Survey Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Survey Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Survey ID</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{survey.id}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(survey.id)
                          toast.success('Survey ID copied')
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="text-base font-medium mt-1">{survey.category || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-base mt-1">{survey.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Creator</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 mt-1"
                      onClick={() => {
                        const creatorId = survey.creator_id || (survey as any).user_id;
                        router.push(`/admin/users?search=${encodeURIComponent(String(creatorId || ''))}`);
                      }}
                    >
                      View Creator Profile →
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Target Responses</p>
                    <p className="text-base font-medium mt-1">{targetResponsesNum}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            {questionList.length === 0 ? (
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No questions found for this survey.</p>
                </CardContent>
              </Card>
            ) : (
              questionList.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                        <CardDescription>{question.question_type}</CardDescription>
                      </div>
                      {question.required && (
                        <Badge variant="outline" className="bg-orange-50 border-orange-200">
                          Required
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-base">{question.question_text}</p>
                    {question.options && question.options.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Options:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {question.options.map((option: string, idx: number) => (
                            <li key={idx} className="text-sm">
                              {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Survey Actions</CardTitle>
                <CardDescription>Manage this survey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/surveys/${survey.id}/responses`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Responses
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/surveys/${survey.id}/analytics`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/surveys/${survey.id}/reports`)}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  View Reports ({survey.total_reports})
                </Button>

                <div className="pt-4 border-t">
                  {survey.status !== 'downed' ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        if (confirm('Are you sure you want to take down this survey? It will no longer be visible to users.')) {
                          downMutation.mutate(survey.id, {
                            onSuccess: () => {
                              toast.success('Survey has been taken down.')
                              router.refresh()
                            },
                            onError: (err) => toast.error(err instanceof Error ? err.message : 'Unable to down survey'),
                          })
                        }
                      }}
                      disabled={downMutation.isPending}
                    >
                      {downMutation.isPending ? 'Taking Down...' : 'Take Down Survey'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (confirm('Are you sure you want to restore this survey?')) {
                          restoreMutation.mutate(survey.id, {
                            onSuccess: () => {
                              toast.success('Survey restored to published status.')
                              router.refresh()
                            },
                            onError: (err) => toast.error(err instanceof Error ? err.message : 'Unable to restore'),
                          })
                        }
                      }}
                      disabled={restoreMutation.isPending}
                    >
                      {restoreMutation.isPending ? 'Restoring...' : 'Restore Survey'}
                    </Button>
                  )}
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm('Are you absolutely sure you want to permanently delete this survey? This action cannot be undone.')) {
                      deleteMutation.mutate(survey.id, {
                        onSuccess: () => {
                          toast.success('Survey deleted successfully.')
                          router.push('/admin/surveys')
                        },
                        onError: (err) => toast.error(err instanceof Error ? err.message : 'Unable to delete'),
                      })
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Survey Permanently'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
