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
    const { flashcard_id, ease_factor, interval, repetitions, next_review_date } = body;

    if (!flashcard_id) {
      return NextResponse.json({ error: 'Missing flashcard_id' }, { status: 400 });
    }

    // Upsert progress (insert or update)
    const { data, error } = await supabase
      .from('user_flashcard_progress')
      .upsert({
        user_id: user.id,
        flashcard_id,
        ease_factor,
        interval,
        repetitions,
        next_review_date,
        last_reviewed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,flashcard_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving progress:', error);
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }

    // Update streak
    await updateStreak(supabase, user.id);

    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error('Error in flashcard progress route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateStreak(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const today = new Date().toISOString().split('T')[0];

  // Get current streak data
  const { data: streakData } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!streakData) {
    // Create new streak record
    await supabase.from('user_streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_study_date: today,
    });
    return;
  }

  const lastStudyDate = streakData.last_study_date;

  if (lastStudyDate === today) {
    // Already studied today, no update needed
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = 1;
  if (lastStudyDate === yesterdayStr) {
    // Consecutive day - increase streak
    newStreak = streakData.current_streak + 1;
  }

  const longestStreak = Math.max(newStreak, streakData.longest_streak);

  await supabase
    .from('user_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_study_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}
