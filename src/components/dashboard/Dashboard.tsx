'use client';

import Header from '@/components/layout/Header';
import Link from 'next/link';
import { categories, flashcards, subcategories } from '@/lib/seed-data';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { analytics, loading: analyticsLoading } = useAnalytics();
  const { progress, loading: progressLoading, getDueCards } = useProgress();

  // Calculate cards per category
  const getCardCount = (categoryId: string) => {
    const categorySubs = subcategories.filter(s => s.category_id === categoryId);
    return flashcards.filter(f => categorySubs.some(s => s.id === f.subcategory_id)).length;
  };

  // Get real stats from analytics (authenticated) or progress (local)
  const totalCards = flashcards.length;
  const allFlashcardIds = flashcards.map(f => f.id);

  let cardsLearned = 0;
  let cardsDue = totalCards;
  let streak = 0;

  if (user && analytics) {
    // Use server analytics for authenticated users
    cardsLearned = analytics.overview.cardsLearned;
    cardsDue = analytics.overview.cardsDue;
    streak = analytics.overview.currentStreak;
  } else if (!user && !progressLoading) {
    // Use local progress for anonymous users
    cardsLearned = progress.size;
    cardsDue = getDueCards(allFlashcardIds).length;
  }

  const loading = user ? analyticsLoading : progressLoading;

  if (loading) {
    return (
      <div>
        <Header
          title="Dashboard"
          subtitle="Loading your progress..."
        />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Welcome back! Let's continue studying."
      />

      <div className="p-4 sm:p-6">
        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Cards Due"
            value={cardsDue}
            icon="clock"
          />
          <StatCard
            title="Cards Learned"
            value={cardsLearned}
            icon="check"
          />
          <StatCard
            title="Total Cards"
            value={totalCards}
            icon="stack"
          />
          <StatCard
            title="Day Streak"
            value={streak}
            icon="fire"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/study"
              className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              Start Studying
            </Link>
            <Link
              href="/quiz"
              className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              Take a Quiz
            </Link>
          </div>
        </div>

        {/* Categories Overview */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">Categories</h2>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const cardCount = getCardCount(category.id);
              return (
                <Link
                  key={category.id}
                  href={`/study/${category.id}`}
                  className="card p-4 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}40` }}
                    >
                      <div
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate group-hover:text-pink-400 transition-colors">{category.name}</h3>
                      <p className="text-sm text-gray-500">{cardCount} cards</p>
                    </div>
                    <svg className="h-5 w-5 text-gray-600 group-hover:text-pink-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: 'clock' | 'check' | 'stack' | 'fire';
}) {
  const icons = {
    clock: (
      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    check: (
      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    stack: (
      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    fire: (
      <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
  };

  return (
    <div className="card p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="rounded-lg p-1.5 sm:p-2 bg-pink-500/20 text-pink-400">
          {icons[icon]}
        </div>
        <div>
          <p className="text-xs sm:text-sm text-gray-500">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-pink-400">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
