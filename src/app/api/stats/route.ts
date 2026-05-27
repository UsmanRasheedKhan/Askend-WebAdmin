import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { DashboardStats } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const stats: DashboardStats = {
      total_users: 0,
      total_creators: 0,
      total_fillers: 0,
      active_surveys: 0,
      draft_surveys: 0,
      pending_reports: 0,
      total_revenue: 0,
      withdrawals_pending: 0,
      blocked_users: 0,
      todays_signups: 0,
      todays_surveys: 0,
      todays_responses: 0,
    };

    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const [
      { count: totalUsers },
      { count: totalCreators },
      { count: totalFillers },
      { count: activeSurveys },
      { count: draftSurveys },
      { count: pendingReports },
      { data: revenueData },
      { count: pendingWithdrawalsCount },
      { count: todaysSignups },
      { count: todaysSurveys },
      { count: todaysResponses },
    ] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('user_role', 'creator'),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('user_role', 'filler'),
      supabase.from('surveys').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('surveys').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('report_notifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('transactions').select('amount').eq('status', 'completed').limit(1000),
      supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
      supabase.from('surveys').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
      supabase.from('survey_responses').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
    ]);

    stats.total_users = Number(totalUsers) || 0;
    stats.total_creators = Number(totalCreators) || 0;
    stats.total_fillers = Number(totalFillers) || 0;
    stats.active_surveys = Number(activeSurveys) || 0;
    stats.draft_surveys = Number(draftSurveys) || 0;
    stats.pending_reports = Number(pendingReports) || 0;
    stats.total_revenue = (revenueData || []).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    stats.withdrawals_pending = Number(pendingWithdrawalsCount) || 0;
    stats.todays_signups = Number(todaysSignups) || 0;
    stats.todays_surveys = Number(todaysSurveys) || 0;
    stats.todays_responses = Number(todaysResponses) || 0;

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
