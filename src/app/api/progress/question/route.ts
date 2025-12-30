import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { question_id, selected_answer, is_correct } = body;

    if (!question_id || selected_answer === undefined || is_correct === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert question history
    const { data, error } = await supabase
      .from('user_question_history')
      .insert({
        user_id: user.id,
        question_id,
        selected_answer,
        is_correct,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving question history:', error);
      return NextResponse.json({ error: 'Failed to save question history' }, { status: 500 });
    }

    // Update streak (studying questions also counts)
    await updateStreak(supabase, user.id);

    return NextResponse.json({ history: data });
  } catch (error) {
    console.error('Error in question history route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get question history for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questionIds = searchParams.get('question_ids');

    let query = supabase
      .from('user_question_history')
      .select('*')
      .eq('user_id', user.id)
      .order('answered_at', { ascending: false });

    // Optionally filter by question IDs
    if (questionIds) {
      const ids = questionIds.split(',');
      query = query.in('question_id', ids);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching question history:', error);
      return NextResponse.json({ error: 'Failed to fetch question history' }, { status: 500 });
    }

    return NextResponse.json({ history: data });
  } catch (error) {
    console.error('Error in question history route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateStreak(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data: streakData, error: fetchError } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching streak:', fetchError);
  }

  if (!streakData) {
    const { error: insertError } = await supabase.from('user_streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_study_date: today,
    });
    if (insertError) {
      console.error('Error creating streak:', insertError);
    }
    return;
  }

  const lastStudyDate = streakData.last_study_date;

  if (lastStudyDate === today) {
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = 1;
  if (lastStudyDate === yesterdayStr) {
    newStreak = streakData.current_streak + 1;
  }

  const longestStreak = Math.max(newStreak, streakData.longest_streak);

  const { error: updateError } = await supabase
    .from('user_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_study_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating streak:', updateError);
  }
}
