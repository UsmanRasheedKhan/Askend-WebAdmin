import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    let query = supabase.from('surveys').select('*', { count: 'exact' });

    // Get pagination params from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (page && limit) {
      const start = (page - 1) * limit;
      query = query.range(start, start + limit - 1);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const surveys = (data || []) as any[];

    // Fetch creator names
    const userIds = Array.from(new Set(surveys.map((s) => s.user_id).filter(Boolean)));
    let creatorsMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id,full_name')
        .in('user_id', userIds);
      if (profiles) {
        profiles.forEach((p: any) => {
          creatorsMap[p.user_id] = p;
        });
      }
    }

    // Count responses for each survey
    const counts: Record<number, number> = {};
    for (const survey of surveys) {
      try {
        const { count: responseCount } = await supabase
          .from('survey_responses')
          .select('id', { count: 'exact', head: true })
          .eq('survey_id', survey.id);
        counts[survey.id] = responseCount || 0;
      } catch (e) {
        counts[survey.id] = survey.responses_collected || 0;
      }
    }

    const enriched = surveys.map((s) => {
      const creator = creatorsMap[s.user_id];
      return {
        ...s,
        creator_name: creator?.full_name || 'Unknown Creator',
        responses_count: counts[s.id] || 0,
      };
    });

    const total_pages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      data: enriched,
      total: count || 0,
      total_pages,
      page,
      limit,
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
