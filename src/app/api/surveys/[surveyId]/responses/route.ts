import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const surveyId = params.surveyId;

    if (!surveyId) {
      return NextResponse.json(
        { error: 'Survey ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const responses = (data || []) as any[];

    // Fetch responder names
    const userIds = Array.from(
      new Set(responses.map((r) => r.user_id).filter(Boolean))
    );
    let respondersMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id,full_name')
        .in('user_id', userIds);
      if (profiles) {
        profiles.forEach((p: any) => {
          respondersMap[p.user_id] = p;
        });
      }
    }

    // Map to UI format
    const mapped = responses.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      responder_name: respondersMap[r.user_id]?.full_name || 'Unknown',
      created_at: r.created_at,
      completed_at: r.completed_at,
      response_data: r.response_data || {},
      status: r.status || 'completed',
      time_taken_seconds: r.time_taken_seconds || 0,
      is_valid_response: r.is_valid_response !== false,
    }));

    return NextResponse.json({
      data: mapped,
      total: mapped.length,
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
