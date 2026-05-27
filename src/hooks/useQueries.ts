import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  AdminNotification,
  AdminUser,
  DashboardStats,
  PaginationParams,
  Report,
  Survey,
  SurveyUser,
  Transaction,
  Withdrawal,
} from '@/types';

// Users Hooks
export function useUsers(params?: PaginationParams & { role?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      let query = supabase.from('user_profiles').select('*', { count: 'exact' });

      if (params?.role && params.role !== 'all') {
        query = query.eq('user_role', params.role);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error, count } = await query
        .range(start, end)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        page,
        limit,
      };
    },
    refetchInterval: 30000,
  });
}

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as SurveyUser;
    },
    enabled: !!userId,
  });
}

// Surveys Hooks
export function useSurveys(params?: PaginationParams) {
  return useQuery({
    queryKey: ['surveys', params],
    queryFn: async () => {
      let query = supabase
        .from('surveys')
        .select(`
          *,
          user_profiles:user_id (full_name)
        `, { count: 'exact' });

      // Apply search if needed (though not implemented in params yet)
      
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error, count } = await query
        .range(start, end)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to include creator_name
      const transformedData = data?.map(survey => ({
        ...survey,
        creator_name: (survey.user_profiles as any)?.full_name || 'Unknown Creator',
        responses_count: (survey as any).responses_collected || (survey as any).total_responses_collected || 0
      }));

      return {
        data: transformedData || [],
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        page,
        limit,
      };
    },
    refetchInterval: 30000,
  });
}

export function useSurveyDetail(surveyId: string) {
  return useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const { data: survey, error } = await supabase
        .from('surveys')
        .select(`
          *,
          user_profiles:user_id (full_name, email)
        `)
        .eq('id', surveyId)
        .single();

      if (error) throw error;
      
      const result = { ...survey } as any;
      result.creator_name = (survey.user_profiles as any)?.full_name || 'Unknown Creator';
      result.responses_count = (survey as any).responses_collected || (survey as any).total_responses_collected || 0;

      // parse questions
      try {
        if (typeof result.questions === 'string') {
          result.questions = JSON.parse(result.questions);
        }
      } catch (e) {
        // Already an object or invalid
      }

      if (!Array.isArray(result.questions)) {
        result.questions = [];
      }

      return result as Survey;
    },
    enabled: !!surveyId,
  });
}

export function useSurveyResponses(surveyId?: string) {
  return useQuery({
    queryKey: ['survey-responses', surveyId],
    queryFn: async () => {
      if (!surveyId) return [];

      const { data, error } = await supabase
        .from('survey_responses')
        .select(`
          *,
          user_profiles:user_id (full_name, email)
        `)
        .eq('survey_id', surveyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(resp => ({
        ...resp,
        responder_name: (resp.user_profiles as any)?.full_name || 'Anonymous',
        responder_email: (resp.user_profiles as any)?.email || ''
      })) || [];
    },
    enabled: !!surveyId,
  });
}

export function useSurveyReports(surveyId?: string) {
  return useQuery({
    queryKey: ['survey-reports', surveyId],
    queryFn: async () => {
      if (!surveyId) return [] as any[];
      const { data, error } = await supabase.from('reports').select('*').eq('target_id', surveyId).eq('report_type', 'survey').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Report[];
    },
    enabled: !!surveyId,
  });
}

// Reports Hooks
export function useReports(params?: PaginationParams) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: async () => {
      let query = supabase.from('reports').select('*', { count: 'exact' });

      if (params?.sort_by) {
        query = query.order(params.sort_by, {
          ascending: params.sort_order === 'asc',
        });
      }

      if (params?.page && params?.limit) {
        const start = (params.page - 1) * params.limit;
        query = query.range(start, start + params.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const limit = params?.limit || 10;
      const total_pages = Math.ceil((count || 0) / limit);

      return {
        data: data as Report[],
        total: count || 0,
        total_pages,
        page: params?.page || 1,
        limit,
      };
    },
  });
}

// Dashboard Stats Hook
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: activeSurveys },
        { count: pendingReports },
        { data: transactions },
        { count: creators },
        { count: fillers },
        { count: blockedUsers },
        { count: pendingWithdrawals }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('transactions').select('amount').eq('status', 'completed'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('user_role', 'creator'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('user_role', 'filler'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).neq('status', 'active'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      const totalRevenue = transactions?.reduce((sum, tx) => sum + Number(tx.amount || 0), 0) || 0;

      return {
        total_users: totalUsers || 0,
        active_surveys: activeSurveys || 0,
        pending_reports: pendingReports || 0,
        total_revenue: totalRevenue,
        total_creators: creators || 0,
        total_fillers: fillers || 0,
        blocked_users: blockedUsers || 0,
        withdrawals_pending: pendingWithdrawals || 0,
        todays_signups: 0, 
        todays_surveys: 0,
      } as any;
    },
    refetchInterval: 30000,
  });
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      const startIso = startDate.toISOString();

      const [userRes, transactionRes] = await Promise.all([
        supabase.from('user_profiles').select('created_at').gte('created_at', startIso),
        supabase
          .from('transactions')
          .select('amount, created_at')
          .gte('created_at', startIso)
          .eq('status', 'completed'),
      ]);

      if (userRes.error) throw userRes.error;
      if (transactionRes.error) throw transactionRes.error;

      const users = userRes.data || [];
      const transactions = transactionRes.data || [];

      const dateMap = Array.from({ length: 7 }).map((_, idx) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + idx);
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          label,
          users: 0,
          revenue: 0,
          timestamp: date.getTime(),
        };
      });

      users.forEach((item) => {
        const createdAt = new Date(item.created_at as string).setHours(0, 0, 0, 0);
        const bucket = dateMap.find((entry) => entry.timestamp === createdAt);
        if (bucket) bucket.users += 1;
      });

      transactions.forEach((item) => {
        const createdAt = new Date(item.created_at as string).setHours(0, 0, 0, 0);
        const bucket = dateMap.find((entry) => entry.timestamp === createdAt);
        if (bucket) bucket.revenue += Number((item as Transaction).amount || 0);
      });

      return {
        userGrowthData: dateMap.map(({ label, users }) => ({ date: label, users })),
        revenueData: dateMap.map(({ label, revenue }) => ({ date: label, revenue })),
      };
    },
    refetchInterval: 30000,
  });
}

export function usePayments(params?: PaginationParams) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: async () => {
      let transactionQuery = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      let withdrawalQuery = supabase.from('withdrawals').select('*', { count: 'exact' }).order('requested_at', { ascending: false });

      if (params?.page && params?.limit) {
        const start = (params.page - 1) * params.limit;
        transactionQuery = transactionQuery.range(start, start + params.limit - 1);
        withdrawalQuery = withdrawalQuery.range(start, start + params.limit - 1);
      }

      const [transactionResult, withdrawalResult] = await Promise.all([transactionQuery, withdrawalQuery]);
      if (transactionResult.error) throw transactionResult.error;
      if (withdrawalResult.error) throw withdrawalResult.error;

      const transactions = (transactionResult.data || []) as Transaction[];
      const withdrawals = (withdrawalResult.data || []) as Withdrawal[];

      const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending').length;

      return {
        transactions,
        withdrawals,
        totalRevenue,
        pendingWithdrawals,
        total: transactionResult.count || 0,
        total_pages: Math.ceil((transactionResult.count || 0) / (params?.limit || 10)),
        page: params?.page || 1,
        limit: params?.limit || 10,
      };
    },
    refetchInterval: 30000,
  });
}

export function useNotifications(adminId?: string) {
  return useQuery({
    queryKey: ['notifications', adminId],
    queryFn: async () => {
      let query = supabase.from('admin_notifications').select('*').order('created_at', { ascending: false });
      if (adminId) query = query.eq('admin_id', adminId);
      const { data, error } = await query;
      if (error) throw error;
      return data as AdminNotification[];
    },
    enabled: true,
    refetchInterval: 30000,
  });
}

export function useAdminUser(adminId?: string) {
  return useQuery({
    queryKey: ['admin-user', adminId],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_users').select('*').eq('id', adminId).single();
      if (error) throw error;
      return data as AdminUser;
    },
    enabled: !!adminId,
  });
}

export function useUpdateAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<AdminUser> }) => {
      // Use upsert so the admin_users row is created if it does not already exist
      const payload = { id: userId, ...data } as Partial<AdminUser> & { id: string };
      const { data: updated, error } = await supabase.from('admin_users').upsert(payload).select().single();
      if (error) throw error;
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.userId] });
    },
  });
}

// Mutations
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: Partial<SurveyUser> }) => {
      const { data: updated, error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDownSurveyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (surveyId: string) => {
      const { error } = await supabase
        .from('surveys')
        .update({ status: 'downed' })
        .eq('id', surveyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useRestoreSurveyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (surveyId: string) => {
      const { error } = await supabase
        .from('surveys')
        .update({ status: 'published' })
        .eq('id', surveyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteSurveyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (surveyId: string) => {
      const { error } = await supabase.from('surveys').delete().eq('id', surveyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateReportStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// Report Notifications Hooks
export function useReportNotifications(params?: PaginationParams) {
  return useQuery({
    queryKey: ['report-notifications', params],
    queryFn: async () => {
      let query = supabase.from('report_notifications').select('*', { count: 'exact' });

      if (params?.sort_by) {
        query = query.order(params.sort_by, {
          ascending: params.sort_order === 'asc',
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (params?.page && params?.limit) {
        const start = (params.page - 1) * params.limit;
        query = query.range(start, start + params.limit - 1);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const limit = params?.limit || 10;
      const total_pages = Math.ceil((count || 0) / limit);

      return {
        data: data as any[],
        total: count || 0,
        total_pages,
        page: params?.page || 1,
        limit,
      };
    },
    refetchInterval: 30000,
  });
}

export function useSurveyQuestions(surveyId?: string) {
  return useQuery({
    queryKey: ['survey-questions', surveyId],
    queryFn: async () => {
      if (!surveyId) return [];
      const { data, error } = await supabase
        .from('surveys')
        .select('questions')
        .eq('id', surveyId)
        .single();
      
      if (error) throw error;
      
      let questions = data?.questions || [];
      
      // Parse if string
      if (typeof questions === 'string') {
        try {
          questions = JSON.parse(questions);
        } catch (e) {
          questions = [];
        }
      }

      // Ensure it's an array
      if (!Array.isArray(questions)) {
        questions = [];
      }

      // Normalize field names (text vs question_text, type vs question_type)
      return questions.map((q: any) => ({
        id: q.id || Math.random().toString(36).substr(2, 9),
        question_text: q.question_text || q.text || q.title || '',
        question_type: q.question_type || q.type || 'text',
        options: q.options || q.choices || [],
        required: q.required ?? true
      })) as any[];
    },
    enabled: !!surveyId,
  });
}

// Report Notification Mutations
export function useCreateReportNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      survey_id: string;
      reporter_id: string;
      creator_id: string;
      reason: string;
      description?: string;
    }) => {
      const { data: created, error } = await supabase
        .from('report_notifications')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateReportNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      data,
    }: {
      reportId: string;
      data: Partial<any>;
    }) => {
      const { data: updated, error } = await supabase
        .from('report_notifications')
        .update(data)
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-notifications'] });
    },
  });
}

// Platform Settings Hook
export function usePlatformSettings() {
  return useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'global')
        .single();
      
      if (error) {
        return {
          platform_name: 'Survey Platform',
          currency: 'PKR',
          report_threshold: 25,
          suspension_threshold: 3,
          platform_fee: 10,
          stripe_key: '',
        };
      }
      return data;
    },
    refetchInterval: 60000,
  });
}

// Platform Settings Mutation
export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      // Clean data to match schema
      const payload = {
        id: 'global',
        platform_name: data.platform_name,
        currency: data.currency,
        report_threshold: data.report_threshold,
        suspension_threshold: data.suspension_threshold,
        platform_fee: data.platform_fee,
        stripe_key: data.stripe_key
      };

      const { data: updated, error } = await supabase
        .from('platform_settings')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
  });
}

