'use client';

import Link from 'next/link';

interface OverdueCard {
  id: string;
  front: string;
  dueDate: string;
  daysOverdue: number;
}

interface CardsDueWidgetProps {
  totalDue: number;
  overdueCards: OverdueCard[];
}

export default function CardsDueWidget({ totalDue, overdueCards }: CardsDueWidgetProps) {
  return (
    <div className="rounded-xl border border-pink-500/20 bg-[#12121a] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Cards Due for Review</h2>
        {totalDue > 0 && (
          <span className="text-2xl font-bold text-red-400">{totalDue}</span>
        )}
      </div>

      {totalDue === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-400 font-medium">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No cards due for review</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {overdueCards.slice(0, 5).map((card) => (
              <div
                key={card.id}
                className="p-3 rounded-lg bg-[#1a1a24] border border-gray-800"
              >
                <p className="text-sm text-white line-clamp-2">{card.front}</p>
                <p className="text-xs text-red-400 mt-1">
                  {card.daysOverdue} day{card.daysOverdue !== 1 ? 's' : ''} overdue
                </p>
              </div>
            ))}
          </div>

          {overdueCards.length > 5 && (
            <p className="text-sm text-gray-400 text-center mb-4">
              And {overdueCards.length - 5} more...
            </p>
          )}

          <Link
            href="/"
            className="block w-full py-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-medium text-center transition-colors"
          >
            Start Review Session
          </Link>
        </>
      )}
    </div>
  );
}
