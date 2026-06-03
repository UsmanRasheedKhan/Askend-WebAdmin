import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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

const isNumericId = (value: string) => /^[0-9]+$/.test(value);

export function useAdminRealtime(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'surveys' }, () => {
        queryClient.invalidateQueries({ queryKey: ['surveys'] });
        queryClient.invalidateQueries({ queryKey: ['survey'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'survey_responses' }, () => {
        queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
        queryClient.invalidateQueries({ queryKey: ['survey'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        queryClient.invalidateQueries({ queryKey: ['survey-reports'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['report-notifications'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_settings' }, () => {
        queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}

// Users Hooks
// export function useUsers(params?: PaginationParams & { role?: string; search?: string }) {
//   return useQuery({
//     queryKey: ['users', params],
//     queryFn: async () => {
//       let query = supabase.from('user_profiles').select('*', { count: 'exact' });

//       // Apply role filter - case insensitive comparison if needed, 
//       // but usually 'creator'/'filler' are standard.
//       if (params?.role && params.role !== 'all') {
//         query = query.eq('user_role', params.role);
//       }

//       // Apply search filter if present
//       if (params?.search) {
//         query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
//       }

//       const page = params?.page || 1;
//       const limit = params?.limit || 10;
//       const start = (page - 1) * limit;
//       const end = start + limit - 1;

//       let { data, error, count } = await query
//         .range(start, end)
//         .order('created_at', { ascending: false });

//       if (error) {
//         const fallback = await query
//           .range(start, end)
//           .order('id', { ascending: false });
//         if (fallback.error) throw fallback.error;
//         data = fallback.data;
//         count = fallback.count;
//       }

//       return {
//         data: data || [],
//         total: count || 0,
//         total_pages: Math.ceil((count || 0) / limit),
//         page,
//         limit,
//       };
//     },
//   });
// }

//----------------------------------------------------------------------------------------------------------
// Users Hooks
export function useUsers(params?: PaginationParams & { role?: string; search?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      // 1. Build the query string for your Next.js API
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.role && params.role !== 'all') searchParams.append('role', params.role);
      if (params?.search) searchParams.append('search', params.search);

      // 2. Call your local API route instead of Supabase directly
      const response = await fetch(`/api/users?${searchParams.toString()}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch users');
      }

      // This returns the { data, total, total_pages, ... } object from your route.ts
      return response.json();
    },
  });
}
//-----------------------------------------------------------------------------------------------------------

export function useUserDetail(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        const { data: userById, error: userByIdError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (userByIdError) throw userByIdError;
        return userById as SurveyUser;
      }
      return data as SurveyUser;
    },
    enabled: !!userId,
  });
}

// Surveys Hooks
export function useSurveys(params?: PaginationParams & { search?: string }) {
  return useQuery({
    queryKey: ['surveys', params],
    queryFn: async () => {
      let query = supabase
        .from('surveys')
        .select('*', { count: 'exact' });

      // Apply search filter if present
      if (params?.search) {
        query = query.ilike('title', `%${params.search}%`);
      }
      
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      let { data, error, count } = await query
        .range(start, end)
        .order('created_at', { ascending: false });

      if (error) {
        const fallback = await query
          .range(start, end)
          .order('id', { ascending: false });
        if (fallback.error) throw fallback.error;
        data = fallback.data;
        count = fallback.count;
      }

      const surveys = data || [];
      const creatorIds = Array.from(
        new Set(
          surveys
            .map((survey: any) => survey.creator_id || survey.user_id)
            .filter(Boolean)
        )
      );

      let creatorMap = new Map<string, string>();
      if (creatorIds.length > 0) {
        let profilesResult = await supabase
          .from('user_profiles')
          .select('id, user_id, full_name')
          .in('user_id', creatorIds);

        if (profilesResult.error) {
          profilesResult = await supabase
            .from('user_profiles')
            .select('id, user_id, full_name')
            .in('id', creatorIds as any);
        }

        if (!profilesResult.error && profilesResult.data) {
          creatorMap = new Map(
            profilesResult.data.map((profile: any) => [profile.user_id || profile.id, profile.full_name])
          );
        }
      }

      // Transform to include creator_name
      const transformedData = surveys.map((survey: any) => {
        const creatorId = survey.creator_id || survey.user_id;
        return {
          ...survey,
          creator_name: creatorMap.get(creatorId) || 'Unknown Creator',
          responses_count:
            survey.responses_colleted ??
            survey.responses_collected ??
            survey.total_responses_collected ??
            0,
        };
      });

      return {
        data: transformedData || [],
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
        page,
        limit,
      };
    },
  });
}

export function useSurveyDetail(surveyId: string) {
  return useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const idValue = isNumericId(surveyId) ? Number(surveyId) : surveyId;
      const { data: survey, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', idValue)
        .maybeSingle();

      if (error) throw error;
      if (!survey) return null as any;

      const creatorId = (survey as any).creator_id || (survey as any).user_id;
      let creatorProfile: { full_name?: string; email?: string } | null = null;

      if (creatorId) {
        let profileResult = await supabase
          .from('user_profiles')
          .select('id, user_id, full_name, email')
          .eq('user_id', creatorId)
          .maybeSingle();

        if (profileResult.error) {
          profileResult = await supabase
            .from('user_profiles')
            .select('id, user_id, full_name, email')
            .eq('id', creatorId)
            .maybeSingle();
        }

        if (!profileResult.error) {
          creatorProfile = profileResult.data as any;
        }
      }
      
      const result = { ...survey } as any;
      result.creator_name = creatorProfile?.full_name || 'Unknown Creator';
      result.creator_email = creatorProfile?.email || '';
      result.responses_count =
        (survey as any).responses_colleted ??
        (survey as any).responses_collected ??
        (survey as any).total_responses_collected ??
        0;

      // survey_questions is the column name for JSONB questions
      const questionsData = result.survey_questions || result.questions;

      // parse questions
      try {
        if (typeof questionsData === 'string') {
          result.questions = JSON.parse(questionsData);
        } else {
          result.questions = questionsData;
        }
      } catch (e) {
        // Already an object or invalid
      }

      if (result.questions && typeof result.questions === 'object' && !Array.isArray(result.questions)) {
        const nested = result.questions as { questions?: unknown; items?: unknown };
        if (Array.isArray(nested.questions)) {
          result.questions = nested.questions;
        } else if (Array.isArray(nested.items)) {
          result.questions = nested.items;
        }
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
        .select('*')
        .eq('survey_id', isNumericId(surveyId) ? Number(surveyId) : surveyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const responses = data || [];
      const responderIds = Array.from(
        new Set(responses.map((resp: any) => resp.user_id).filter(Boolean))
      );

      let responderMap = new Map<string, { full_name?: string; email?: string }>();
      if (responderIds.length > 0) {
        let profilesResult = await supabase
          .from('user_profiles')
          .select('id, user_id, full_name, email')
          .in('user_id', responderIds);

        if (profilesResult.error) {
          profilesResult = await supabase
            .from('user_profiles')
            .select('id, user_id, full_name, email')
            .in('id', responderIds as any);
        }

        if (!profilesResult.error && profilesResult.data) {
          responderMap = new Map(
            profilesResult.data.map((profile: any) => [profile.user_id || profile.id, profile])
          );
        }
      }

      return responses.map((resp: any) => {
        const responder = responderMap.get(resp.user_id) || {};
        return {
          ...resp,
          responder_name: responder.full_name || 'Anonymous',
          responder_email: responder.email || '',
        };
      });
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const [
        { count: totalUsers },
        { count: activeSurveys },
        { count: pendingReports },
        { data: transactions },
        { count: creators },
        { count: fillers },
        { count: blockedUsers },
        { count: pendingWithdrawals },
        { count: todaysSignups },
        { count: todaysSurveys }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('transactions').select('amount').eq('status', 'completed'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('user_role', 'creator'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('user_role', 'filler'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).neq('status', 'active'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('surveys').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
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
        todays_signups: todaysSignups || 0, 
        todays_surveys: todaysSurveys || 0,
      } as any;
    },
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
  });
}

export function usePayments(params?: PaginationParams) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: async () => {
      let transactionQuery = supabase
        .from('transactions')
        .select(`
          *,
          user_profiles:user_id (full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });
      let withdrawalQuery = supabase.from('withdrawals').select(`
          *,
          user_profiles:user_id (full_name)
        `, { count: 'exact' }).order('requested_at', { ascending: false });

      if (params?.page && params?.limit) {
        const start = (params.page - 1) * params.limit;
        transactionQuery = transactionQuery.range(start, start + params.limit - 1);
        withdrawalQuery = withdrawalQuery.range(start, start + params.limit - 1);
      }

      const [transactionResult, withdrawalResult] = await Promise.all([transactionQuery, withdrawalQuery]);
      if (transactionResult.error) throw transactionResult.error;
      if (withdrawalResult.error) throw withdrawalResult.error;

      const transactions = (transactionResult.data || []).map(tx => ({
        ...tx,
        creator_name: (tx.user_profiles as any)?.full_name || 'Unknown'
      })) as any[];
      
      const withdrawals = (withdrawalResult.data || []).map(w => ({
        ...w,
        creator_name: (w.user_profiles as any)?.full_name || 'Unknown'
      })) as any[];

      const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;
      const pendingWithdrawalsAmount = withdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount || 0), 0);

      return {
        transactions,
        withdrawals,
        totalRevenue,
        pendingWithdrawalsCount,
        pendingWithdrawalsAmount,
        total: transactionResult.count || 0,
        total_pages: Math.ceil((transactionResult.count || 0) / (params?.limit || 10)),
        page: params?.page || 1,
        limit: params?.limit || 10,
      };
    },
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
    mutationFn: async ({
      userId,
      matchField,
      data,
    }: {
      userId: string;
      matchField?: 'user_id' | 'id';
      data: Partial<SurveyUser>;
    }) => {
      const filterField = matchField || 'user_id';
      const { data: updated, error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq(filterField, userId)
        .select()
        .maybeSingle();

      if (error || !updated) {
        const fallbackField = filterField === 'user_id' ? 'id' : 'user_id';
        const fallback = await supabase
          .from('user_profiles')
          .update(data)
          .eq(fallbackField, userId)
          .select()
          .maybeSingle();

        if (fallback.error) throw fallback.error;
        return fallback.data;
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
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
  });
}

export function useSurveyQuestions(surveyId?: string) {
  return useQuery({
    queryKey: ['survey-questions', surveyId],
    queryFn: async () => {
      if (!surveyId) return [];
      const { data, error } = await supabase
        .from('surveys')
        .select('survey_questions, questions')
        .eq('id', isNumericId(surveyId) ? Number(surveyId) : surveyId)
        .single();
      
      if (error) throw error;
      
      let questions = data?.survey_questions || data?.questions || [];

      if (questions && typeof questions === 'object' && !Array.isArray(questions)) {
        const nested = questions as { questions?: unknown; items?: unknown };
        if (Array.isArray(nested.questions)) {
          questions = nested.questions;
        } else if (Array.isArray(nested.items)) {
          questions = nested.items;
        }
      }
      
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

