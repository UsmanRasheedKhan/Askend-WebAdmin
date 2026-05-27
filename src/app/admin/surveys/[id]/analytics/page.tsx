'use client'

import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSurveyDetail, useSurveyResponses, useSurveyQuestions } from '@/hooks/useQueries'
import { formatDate } from '@/utils'
import { AlertCircle } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export default function SurveyAnalyticsPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const surveyId = params.id
  const { data: survey, isLoading: surveyLoading } = useSurveyDetail(surveyId || '')
  const { data: responses, isLoading: responsesLoading } = useSurveyResponses(surveyId)
  const { data: questions } = useSurveyQuestions(surveyId)

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

  const totalResponses = responses?.length || 0
  const targetResponses = survey.target_responses || 1
  const completionRate = Math.round((totalResponses / targetResponses) * 100)
  const avgTimeSeconds = responses && responses.length > 0
    ? responses.reduce((sum, r) => sum + (r.time_taken_seconds || 0), 0) / responses.length
    : 0
  const avgTimeMinutes = Math.round(avgTimeSeconds / 60)

  // Timeline data
  const timelineData: any[] = []
  if (responses && responses.length > 0) {
    const dates: Record<string, number> = {}
    responses.forEach((r) => {
      const dateVal = r.completed_at || r.created_at
      if (!dateVal) return
      const dateStr = new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dates[dateStr] = (dates[dateStr] || 0) + 1
    })
    Object.entries(dates).forEach(([date, count]) => {
      timelineData.push({ date, responses: count })
    })
  }

  // Response distribution
  const responseDistribution = [
    { name: 'Completed', value: totalResponses, fill: '#10b981' },
    { name: 'Remaining', value: Math.max(0, (survey.target_responses || 0) - totalResponses), fill: '#e5e7eb' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
            ← Back to Survey
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Survey Analytics</h1>
          <p className="text-muted-foreground">{survey.title}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Responses</div>
              <div className="text-3xl font-bold mt-2">{totalResponses}</div>
              <div className="text-xs text-muted-foreground mt-2">of {targetResponses} target</div>
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
              <div className="text-sm text-muted-foreground">Avg. Time to Complete</div>
              <div className="text-3xl font-bold mt-2">{avgTimeMinutes}</div>
              <div className="text-xs text-muted-foreground mt-2">minutes</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Unique Responders</div>
              <div className="text-3xl font-bold mt-2">
                {new Set(responses?.map(r => r.user_id) || []).size}
              </div>
              <div className="text-xs text-muted-foreground mt-2">from {totalResponses} responses</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Timeline */}
          {timelineData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Response Timeline</CardTitle>
                <CardDescription>Responses by date</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="responses" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Completion Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Completion Status</CardTitle>
              <CardDescription>Target vs. Actual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={responseDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {responseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Survey Information */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-base font-medium mt-1">{formatDate(survey.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-base font-medium mt-1">
                  {survey.published_at ? formatDate(survey.published_at) : 'Not published'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-base font-medium mt-1 capitalize">{survey.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-base font-medium mt-1">{survey.category || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-base font-medium mt-1">{questions?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reports</p>
                <p className="text-base font-medium mt-1">{survey.total_reports}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Summary */}
        {questions && questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Survey Questions</CardTitle>
              <CardDescription>{questions.length} questions in this survey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {questions.map((question, idx) => (
                  <div key={question.id} className="flex items-center gap-3 p-3 border rounded">
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-medium">
                      Q{idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{question.question_text}</p>
                      <p className="text-xs text-muted-foreground">{question.question_type}</p>
                    </div>
                    {question.required && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Required</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
