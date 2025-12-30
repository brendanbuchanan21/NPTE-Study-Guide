import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { categories, subcategories, flashcards } from '@/lib/seed-data';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data in parallel
    const [progressResult, streakResult, historyResult] = await Promise.all([
      supabase
        .from('user_flashcard_progress')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('user_question_history')
        .select('*')
        .eq('user_id', user.id)
        .order('answered_at', { ascending: false })
        .limit(100),
    ]);

    const progress = progressResult.data || [];
    const streak = streakResult.data || { current_streak: 0, longest_streak: 0 };
    const questionHistory = historyResult.data || [];

    // Calculate analytics
    const now = new Date();
    const progressMap = new Map(progress.map(p => [p.flashcard_id, p]));

    // Cards learned (reviewed at least once)
    const cardsLearned = progress.length;

    // Cards due for review
    const cardsDue = progress.filter(p => new Date(p.next_review_date) <= now).length;

    // Questions answered
    const questionsAnswered = questionHistory.length;

    // Overall accuracy
    const correctAnswers = questionHistory.filter(h => h.is_correct).length;
    const accuracy = questionsAnswered > 0
      ? Math.round((correctAnswers / questionsAnswered) * 100)
      : 0;

    // Calculate category performance
    const categoryStats = categories.map(category => {
      const categorySubcats = subcategories.filter(s => s.category_id === category.id);
      const categoryCards = flashcards.filter(f =>
        categorySubcats.some(s => s.id === f.subcategory_id)
      );

      const categoryProgress = categoryCards.filter(c => progressMap.has(c.id));
      const categoryDue = categoryProgress.filter(c => {
        const p = progressMap.get(c.id);
        return p && new Date(p.next_review_date) <= now;
      });

      // Calculate average ease factor as a proxy for performance
      let avgEaseFactor = 2.5;
      let avgReps = 0;
      let performanceScore = 0;

      if (categoryProgress.length > 0) {
        const totalEase = categoryProgress.reduce((sum, c) => {
          const p = progressMap.get(c.id);
          return sum + (p?.ease_factor || 2.5);
        }, 0);
        avgEaseFactor = totalEase / categoryProgress.length;

        // Calculate accuracy from repetitions (higher repetitions = better performance)
        avgReps = categoryProgress.reduce((sum, c) => {
          const p = progressMap.get(c.id);
          return sum + (p?.repetitions || 0);
        }, 0) / categoryProgress.length;

        // Score based on ease factor and repetitions (only if there's progress)
        performanceScore = Math.round(
          ((avgEaseFactor - 1.3) / (2.5 - 1.3)) * 50 + // Normalize ease factor
          Math.min(avgReps * 10, 50) // Cap repetition bonus at 50
        );
      }

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        totalCards: categoryCards.length,
        cardsLearned: categoryProgress.length,
        cardsDue: categoryDue.length,
        performanceScore: Math.min(100, Math.max(0, performanceScore)),
        avgEaseFactor,
      };
    });

    // Sort by performance (best to worst)
    categoryStats.sort((a, b) => b.performanceScore - a.performanceScore);

    // Calculate subcategory breakdown
    const subcategoryStats = subcategories.map(subcategory => {
      const subcatCards = flashcards.filter(f => f.subcategory_id === subcategory.id);
      const subcatProgress = subcatCards.filter(c => progressMap.has(c.id));
      const subcatDue = subcatProgress.filter(c => {
        const p = progressMap.get(c.id);
        return p && new Date(p.next_review_date) <= now;
      });

      return {
        id: subcategory.id,
        categoryId: subcategory.category_id,
        name: subcategory.name,
        totalCards: subcatCards.length,
        cardsLearned: subcatProgress.length,
        cardsDue: subcatDue.length,
      };
    });

    // Calculate 30-day trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats: Record<string, { studied: number; correct: number }> = {};

    // Initialize all days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = { studied: 0, correct: 0 };
    }

    // Count from progress reviews
    progress.forEach(p => {
      const reviewDate = new Date(p.last_reviewed_at).toISOString().split('T')[0];
      if (dailyStats[reviewDate]) {
        dailyStats[reviewDate].studied++;
        // Use ease factor as proxy: > 2.5 is considered "correct"
        if (p.ease_factor >= 2.5) {
          dailyStats[reviewDate].correct++;
        }
      }
    });

    const trend = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        cardsStudied: stats.studied,
        accuracy: stats.studied > 0
          ? Math.round((stats.correct / stats.studied) * 100)
          : null,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Most overdue cards
    const overdueCards = progress
      .filter(p => new Date(p.next_review_date) < now)
      .sort((a, b) => new Date(a.next_review_date).getTime() - new Date(b.next_review_date).getTime())
      .slice(0, 10)
      .map(p => {
        const card = flashcards.find(f => f.id === p.flashcard_id);
        return {
          id: p.flashcard_id,
          front: card?.front_text.substring(0, 100) || 'Unknown',
          dueDate: p.next_review_date,
          daysOverdue: Math.floor((now.getTime() - new Date(p.next_review_date).getTime()) / (1000 * 60 * 60 * 24)),
        };
      });

    return NextResponse.json({
      overview: {
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        cardsLearned,
        cardsDue,
        totalCards: flashcards.length,
        questionsAnswered,
        accuracy,
      },
      categoryPerformance: categoryStats,
      subcategoryBreakdown: subcategoryStats,
      trend,
      overdueCards,
      recentHistory: questionHistory.slice(0, 20),
    });
  } catch (error) {
    console.error('Error in analytics route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
