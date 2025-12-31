'use client';

import Header from '@/components/layout/Header';
import Link from 'next/link';
import { categories, getFlashcardsForCategory, flashcards } from '@/lib/seed-data';
import { useProgress } from '@/hooks/useProgress';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';

export default function StudyPage() {
  const { user } = useAuth();
  const { progress, loading: progressLoading, getDueCards } = useProgress();
  const { analytics, loading: analyticsLoading } = useAnalytics();

  const loading = user ? analyticsLoading : progressLoading;

  // Get total stats for mixed mode
  const getTotalStats = () => {
    const allCardIds = flashcards.map(c => c.id);

    if (user && analytics) {
      return {
        total: analytics.overview.totalCards,
        learned: analytics.overview.cardsLearned,
        due: analytics.overview.cardsDue,
      };
    } else {
      const learned = allCardIds.filter(id => progress.has(id)).length;
      const due = getDueCards(allCardIds).length;
      return { total: flashcards.length, learned, due };
    }
  };

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

  const totalStats = loading ? { total: flashcards.length, learned: 0, due: flashcards.length } : getTotalStats();

  return (
    <div>
      <Header
        title="Study"
        subtitle="Choose a category to start studying"
      />

      <div className="p-4 sm:p-6">
        {/* Mixed Study Option */}
        <div className="mb-6">
          <Link
            href="/study/mixed"
            className="card p-6 group block border-2 border-dashed border-pink-500/30 hover:border-pink-500/60 bg-gradient-to-br from-pink-500/5 to-purple-500/5"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg transition-transform group-hover:scale-110 flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-500">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-pink-400 transition-colors">Mixed Study</h3>
                <p className="mt-1 text-sm text-gray-500">Random cards from all categories - great for comprehensive review</p>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="text-gray-400">{totalStats.learned}/{totalStats.total} learned</span>
                  {totalStats.due > 0 && (
                    <span className="text-pink-400">{totalStats.due} due</span>
                  )}
                </div>
                {/* Progress bar */}
                {totalStats.total > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${(totalStats.learned / totalStats.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>

        <h2 className="text-lg font-semibold text-white mb-4">By Category</h2>

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
