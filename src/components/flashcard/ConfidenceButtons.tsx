'use client';

import { ConfidenceRating } from '@/types';

interface ConfidenceButtonsProps {
  onRate: (rating: ConfidenceRating) => void;
  intervals?: Record<ConfidenceRating, number>;
  disabled?: boolean;
}

function formatInterval(days: number): string {
  if (days === 0) return '<1d';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

export default function ConfidenceButtons({
  onRate,
  intervals,
  disabled = false
}: ConfidenceButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center gap-4">
        {/* Don't Know - maps to 'again' */}
        <button
          onClick={() => onRate('again')}
          disabled={disabled}
          className={`flex flex-col items-center rounded-xl px-8 py-4 text-white transition-all border-2 border-red-500/50 bg-red-500/20 hover:bg-red-500/40 hover:border-red-500 ${
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 hover:shadow-lg'
          }`}
        >
          <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="font-semibold text-base">Don&apos;t Know</span>
          {intervals && (
            <span className="text-xs opacity-70 mt-1">
              See again {formatInterval(intervals.again)}
            </span>
          )}
        </button>

        {/* Know - maps to 'good' */}
        <button
          onClick={() => onRate('good')}
          disabled={disabled}
          className={`flex flex-col items-center rounded-xl px-8 py-4 text-white transition-all border-2 border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/40 hover:border-emerald-500 ${
            disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 hover:shadow-lg'
          }`}
        >
          <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold text-base">Know</span>
          {intervals && (
            <span className="text-xs opacity-70 mt-1">
              See again {formatInterval(intervals.good)}
            </span>
          )}
        </button>
      </div>
      <p className="text-center text-xs text-gray-500">
        Swipe left for Don&apos;t Know, right for Know
      </p>
    </div>
  );
}
