'use client';

interface DayTrend {
  date: string;
  cardsStudied: number;
  accuracy: number | null;
}

interface PerformanceTrendChartProps {
  trend: DayTrend[];
}

export default function PerformanceTrendChart({ trend }: PerformanceTrendChartProps) {
  const maxCards = Math.max(...trend.map(d => d.cardsStudied), 1);

  const getBarColor = (accuracy: number | null) => {
    if (accuracy === null) return 'bg-gray-600';
    if (accuracy >= 80) return 'bg-green-500';
    if (accuracy >= 60) return 'bg-amber-500';
    return 'bg-pink-500';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Only show every nth label to avoid crowding
  const showLabel = (index: number) => {
    return index % 5 === 0 || index === trend.length - 1;
  };

  return (
    <div className="rounded-xl border border-pink-500/20 bg-[#12121a] p-6">
      <h2 className="text-lg font-semibold text-white mb-2">30-Day Activity</h2>
      <p className="text-sm text-gray-400 mb-6">
        Bar height = cards studied, color = accuracy (green 80%+, amber 60-79%, pink &lt;60%)
      </p>

      <div className="relative h-40">
        <div className="absolute inset-0 flex items-end gap-0.5">
          {trend.map((day, index) => {
            const height = day.cardsStudied > 0
              ? Math.max((day.cardsStudied / maxCards) * 100, 5)
              : 2;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center justify-end group relative"
              >
                <div
                  className={`w-full rounded-t ${getBarColor(day.accuracy)} transition-all hover:opacity-80`}
                  style={{ height: `${height}%` }}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                    <p className="text-white font-medium">{formatDate(day.date)}</p>
                    <p className="text-gray-400">
                      {day.cardsStudied} card{day.cardsStudied !== 1 ? 's' : ''}
                    </p>
                    {day.accuracy !== null && (
                      <p className={getBarColor(day.accuracy).replace('bg-', 'text-')}>
                        {day.accuracy}% accuracy
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {trend.map((day, index) => (
          <span key={day.date} className="flex-1 text-center">
            {showLabel(index) ? formatDate(day.date) : ''}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-400">80%+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-gray-400">60-79%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-pink-500" />
          <span className="text-gray-400">&lt;60%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-600" />
          <span className="text-gray-400">No data</span>
        </div>
      </div>
    </div>
  );
}
