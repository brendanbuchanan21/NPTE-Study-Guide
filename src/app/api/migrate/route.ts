import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

interface LocalStorageProgress {
  flashcard_id: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { progressData }: { progressData: LocalStorageProgress[] } = body;

    if (!progressData || !Array.isArray(progressData)) {
      return NextResponse.json({ error: 'Invalid progress data' }, { status: 400 });
    }

    // Check if user already has progress in database
    const { count } = await supabase
      .from('user_flashcard_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count && count > 0) {
      return NextResponse.json({
        message: 'Migration skipped - user already has progress data',
        skipped: true,
      });
    }

    // Transform and insert progress data
    const progressRecords = progressData.map(p => ({
      user_id: user.id,
      flashcard_id: p.flashcard_id,
      ease_factor: p.ease_factor,
      interval: p.interval,
      repetitions: p.repetitions,
      next_review_date: p.next_review_date,
      last_reviewed_at: p.last_reviewed_at,
    }));

    if (progressRecords.length > 0) {
      const { error } = await supabase
        .from('user_flashcard_progress')
        .insert(progressRecords);

      if (error) {
        console.error('Error migrating progress:', error);
        return NextResponse.json({ error: 'Failed to migrate progress' }, { status: 500 });
      }
    }

    // Calculate and create streak from migrated data
    const studyDates = new Set(
      progressData.map(p => new Date(p.last_reviewed_at).toISOString().split('T')[0])
    );

    // Simple streak calculation from migrated data
    const sortedDates = Array.from(studyDates).sort().reverse();
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = expectedDate.toISOString().split('T')[0];

      if (sortedDates.includes(expectedStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Create streak record
    await supabase.from('user_streaks').upsert({
      user_id: user.id,
      current_streak: currentStreak,
      longest_streak: currentStreak,
      last_study_date: sortedDates[0] || today,
    }, {
      onConflict: 'user_id',
    });

    return NextResponse.json({
      message: 'Migration successful',
      migrated: progressRecords.length,
    });
  } catch (error) {
    console.error('Error in migration route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
