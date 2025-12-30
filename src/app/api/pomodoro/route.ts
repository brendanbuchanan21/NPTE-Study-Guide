import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// Save a completed pomodoro session
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { duration_minutes } = body;

    if (!duration_minutes || duration_minutes < 1) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert({
        user_id: user.id,
        duration_minutes,
        completed_at: new Date().toISOString(),
        session_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving pomodoro session:', error);
      return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
    }

    return NextResponse.json({ session: data });
  } catch (error) {
    console.error('Error in pomodoro route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get pomodoro sessions and stats
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '120'); // Default to ~4 months for heat map

    // Get sessions from the last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: sessions, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('session_date', startDate.toISOString().split('T')[0])
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching pomodoro sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions?.filter(s => s.session_date === today) || [];
    const todayCount = todaySessions.length;
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    // Calculate total stats
    const totalCount = sessions?.length || 0;
    const totalMinutes = sessions?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

    // Group by date for heat map
    const dailyStats: Record<string, { count: number; minutes: number }> = {};
    sessions?.forEach(session => {
      const date = session.session_date;
      if (!dailyStats[date]) {
        dailyStats[date] = { count: 0, minutes: 0 };
      }
      dailyStats[date].count++;
      dailyStats[date].minutes += session.duration_minutes;
    });

    // Calculate weekly average
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const weekSessions = sessions?.filter(s => s.session_date >= weekAgoStr) || [];
    const weeklyAvg = weekSessions.length > 0 ? Math.round(weekSessions.length / 7 * 10) / 10 : 0;

    return NextResponse.json({
      today: {
        count: todayCount,
        minutes: todayMinutes,
      },
      total: {
        count: totalCount,
        minutes: totalMinutes,
      },
      weeklyAverage: weeklyAvg,
      dailyStats,
      sessions: sessions?.slice(0, 50), // Return last 50 sessions for recent activity
    });
  } catch (error) {
    console.error('Error in pomodoro route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
