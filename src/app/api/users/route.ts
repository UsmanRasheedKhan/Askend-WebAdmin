import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    let query = supabase.from('user_profiles').select('*', { count: 'exact' });

    // Get pagination params from query string
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (page && limit) {
      const start = (page - 1) * limit;
      query = query.range(start, start + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = (data || []).map((row: any) => ({
      id: row.user_id,
      full_name: row.full_name,
      email: row.email || 'N/A',
      user_role: row.user_role || 'filler',
      wallet_balance: row.wallet_balance ?? 0,
      created_at: row.created_at,
      status: 'active',
    }));

    const total_pages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      data: mapped,
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
