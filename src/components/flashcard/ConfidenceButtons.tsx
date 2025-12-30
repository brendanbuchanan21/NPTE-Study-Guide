'use client';

import { ConfidenceRating } from '@/types';

interface ConfidenceButtonsProps {
  onRate: (rating: ConfidenceRating) => void;
  intervals?: Record<ConfidenceRating, number>;
  disabled?: boolean;
}

const buttons: { rating: ConfidenceRating; label: string; bgColor: string; hoverColor: string; key: string }[] = [
  { rating: 'again', label: 'Again', bgColor: 'bg-red-500/80', hoverColor: 'hover:bg-red-500', key: '1' },
  { rating: 'hard', label: 'Hard', bgColor: 'bg-orange-500/80', hoverColor: 'hover:bg-orange-500', key: '2' },
  { rating: 'good', label: 'Good', bgColor: 'bg-emerald-500/80', hoverColor: 'hover:bg-emerald-500', key: '3' },
  { rating: 'easy', label: 'Easy', bgColor: 'bg-pink-500/80', hoverColor: 'hover:bg-pink-500', key: '4' },
];

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
      <p className="text-center text-sm text-gray-400">How well did you know this?</p>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {buttons.map((button) => (
          <button
            key={button.rating}
            onClick={() => onRate(button.rating)}
            disabled={disabled}
            className={`flex flex-col items-center rounded-lg px-3 sm:px-4 py-2 text-white transition-all border border-transparent hover:border-white/20 ${button.bgColor} ${button.hoverColor} ${
              disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 hover:shadow-lg'
            }`}
          >
            <span className="font-medium text-sm sm:text-base">{button.label}</span>
            {intervals && (
              <span className="text-xs opacity-80">
                {formatInterval(intervals[button.rating])}
              </span>
            )}
            <span className="text-xs opacity-60">[{button.key}]</span>
          </button>
        ))}
      </div>
    </div>
  );
}
