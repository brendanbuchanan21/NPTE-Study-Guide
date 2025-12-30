'use client';

import Link from 'next/link';

interface CategoryStats {
  id: string;
  name: string;
  color: string;
  totalCards: number;
  cardsLearned: number;
  cardsDue: number;
  performanceScore: number;
  avgEaseFactor: number;
}

interface CategoryPerformanceProps {
  categories: CategoryStats[];
}

export default function CategoryPerformance({ categories }: CategoryPerformanceProps) {
  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="rounded-xl border border-pink-500/20 bg-[#12121a] p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Category Performance</h2>
      <p className="text-sm text-gray-400 mb-6">Ranked from best to worst performance</p>

      <div className="space-y-4">
        {categories.map((category, index) => {
          const progress = category.totalCards > 0
            ? (category.cardsLearned / category.totalCards) * 100
            : 0;

          return (
            <Link
              key={category.id}
              href={`/study/${category.id}`}
              className="block group"
            >
              <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                <span className="text-gray-500 text-sm w-6">{index + 1}.</span>

                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium truncate group-hover:text-pink-400 transition-colors">
                      {category.name}
                    </span>
                    <span className={`text-sm font-bold ${getPerformanceColor(category.performanceScore)}`}>
                      {category.performanceScore}%
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{category.cardsLearned}/{category.totalCards} learned</span>
                    {category.cardsDue > 0 && (
                      <span className="text-red-400">{category.cardsDue} due</span>
                    )}
                  </div>

                  <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressBarColor(category.performanceScore)}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>No performance data yet.</p>
            <p className="text-sm mt-1">Start studying to see your progress!</p>
          </div>
        )}
      </div>
    </div>
  );
}
