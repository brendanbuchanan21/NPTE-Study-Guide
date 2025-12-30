'use client';

import Header from '@/components/layout/Header';
import Link from 'next/link';
import { categories, getFlashcardsForCategory } from '@/lib/seed-data';
import { useProgress } from '@/hooks/useProgress';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';

export default function StudyPage() {
  const { user } = useAuth();
  const { progress, loading: progressLoading, getDueCards } = useProgress();
  const { analytics, loading: analyticsLoading } = useAnalytics();

  const loading = user ? analyticsLoading : progressLoading;

  // Get progress for a category
  const getCategoryProgress = (categoryId: string) => {
    const cards = getFlashcardsForCategory(categoryId);
    const cardIds = cards.map(c => c.id);

    if (user && analytics) {
      const catPerf = analytics.categoryPerformance.find(c => c.id === categoryId);
      return {
        total: catPerf?.totalCards || cards.length,
        learned: catPerf?.cardsLearned || 0,
        due: catPerf?.cardsDue || cards.length,
      };
    } else {
      // Local progress
      const learned = cardIds.filter(id => progress.has(id)).length;
      const due = getDueCards(cardIds).length;
      return { total: cards.length, learned, due };
    }
  };

  return (
    <div>
      <Header
        title="Study"
        subtitle="Choose a category to start studying"
      />

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const cards = getFlashcardsForCategory(category.id);
            const cardCount = cards.length;
            const { learned, due } = loading ? { learned: 0, due: cardCount } : getCategoryProgress(category.id);

            return (
              <Link
                key={category.id}
                href={`/study/${category.id}`}
                className="card p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="h-12 w-12 rounded-lg transition-transform group-hover:scale-110 flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}30`, border: `2px solid ${category.color}` }}
                  >
                    <div
                      className="h-6 w-6 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-pink-400 transition-colors">{category.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{learned}/{cardCount} learned</span>
                      {due > 0 && (
                        <span className="text-pink-400">{due} due</span>
                      )}
                      {due === 0 && cardCount > 0 && (
                        <span className="text-green-400">All caught up!</span>
                      )}
                    </div>
                    {/* Progress bar */}
                    {cardCount > 0 && (
                      <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-500 rounded-full transition-all"
                          style={{ width: `${(learned / cardCount) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
