'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePomodoro } from '@/hooks/usePomodoro';
import Header from '@/components/layout/Header';
import OverviewStats from '@/components/progress/OverviewStats';
import CategoryPerformance from '@/components/progress/CategoryPerformance';
import SubcategoryBreakdown from '@/components/progress/SubcategoryBreakdown';
import CardsDueWidget from '@/components/progress/CardsDueWidget';
import PerformanceTrendChart from '@/components/progress/PerformanceTrendChart';
import RecentActivity from '@/components/progress/RecentActivity';
import PomodoroStats from '@/components/pomodoro/PomodoroStats';
import PomodoroHeatMap from '@/components/pomodoro/PomodoroHeatMap';
import Link from 'next/link';
import { categories } from '@/lib/seed-data';

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const { analytics, loading, error } = useAnalytics();
  const { stats: pomodoroStats } = usePomodoro();

  // Show sign-in prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div>
        <Header
          title="Your Progress"
          subtitle="Track your study progress and performance"
        />
        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-pink-500/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Sign in to Track Your Progress
            </h2>
            <p className="text-gray-400 mb-8">
              Create an account to save your progress, track your performance by category,
              see study trends, and sync across devices.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-500 hover:bg-pink-600 px-6 py-3 text-white font-medium transition-colors"
            >
              Sign In to Get Started
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <div>
        <Header
          title="Your Progress"
          subtitle="Track your study progress and performance"
        />
        <div className="p-6 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <Header
          title="Your Progress"
          subtitle="Track your study progress and performance"
        />
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-pink-400 hover:text-pink-300"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No analytics data yet
  if (!analytics) {
    return (
      <div>
        <Header
          title="Your Progress"
          subtitle="Track your study progress and performance"
        />
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-400">No progress data available yet.</p>
            <Link href="/dashboard" className="text-pink-400 hover:text-pink-300 mt-2 inline-block">
              Start studying!
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryInfo = categories.map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }));

  return (
    <div>
      <Header
        title="Your Progress"
        subtitle="Track your study progress and performance"
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Overview Stats */}
        <OverviewStats
          currentStreak={analytics.overview.currentStreak}
          longestStreak={analytics.overview.longestStreak}
          cardsLearned={analytics.overview.cardsLearned}
          cardsDue={analytics.overview.cardsDue}
          totalCards={analytics.overview.totalCards}
          questionsAnswered={analytics.overview.questionsAnswered}
          accuracy={analytics.overview.accuracy}
        />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Category Performance */}
          <div className="lg:col-span-2">
            <CategoryPerformance categories={analytics.categoryPerformance} />
          </div>

          {/* Right column - Cards Due */}
          <div>
            <CardsDueWidget
              totalDue={analytics.overview.cardsDue}
              overdueCards={analytics.overdueCards}
            />
          </div>
        </div>

        {/* Performance Trend Chart */}
        <PerformanceTrendChart trend={analytics.trend} />

        {/* Second grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subcategory Breakdown */}
          <SubcategoryBreakdown
            subcategories={analytics.subcategoryBreakdown}
            categories={categoryInfo}
          />

          {/* Recent Activity */}
          <RecentActivity history={analytics.recentHistory} />
        </div>

        {/* Pomodoro Section */}
        {pomodoroStats && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <PomodoroStats
                todayCount={pomodoroStats.today.count}
                todayMinutes={pomodoroStats.today.minutes}
                totalCount={pomodoroStats.total.count}
                totalMinutes={pomodoroStats.total.minutes}
                weeklyAverage={pomodoroStats.weeklyAverage}
              />
              <div className="lg:col-span-2">
                <PomodoroHeatMap dailyStats={pomodoroStats.dailyStats} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
