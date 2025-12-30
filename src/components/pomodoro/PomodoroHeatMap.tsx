'use client';

import { useMemo } from 'react';

interface DailyStats {
  count: number;
  minutes: number;
}

interface PomodoroHeatMapProps {
  dailyStats: Record<string, DailyStats>;
  weeks?: number; // Number of weeks to show (default 16 = ~4 months)
}

export default function PomodoroHeatMap({ dailyStats, weeks = 16 }: PomodoroHeatMapProps) {
  const { grid, maxCount, monthLabels } = useMemo(() => {
    const today = new Date();
    const days: { date: string; count: number; minutes: number; dayOfWeek: number }[] = [];

    // Generate all days for the grid (weeks * 7 days)
    const totalDays = weeks * 7;
    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const stats = dailyStats[dateStr] || { count: 0, minutes: 0 };
      days.push({
        date: dateStr,
        count: stats.count,
        minutes: stats.minutes,
        dayOfWeek: date.getDay(),
      });
    }

    // Find max count for color scaling
    const maxCount = Math.max(...days.map(d => d.count), 1);

    // Build grid by weeks
    const grid: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      grid.push(days.slice(i, i + 7));
    }

    // Generate month labels
    const monthLabels: { month: string; weekIndex: number }[] = [];
    let lastMonth = '';
    grid.forEach((week, weekIndex) => {
      const firstDay = week.find(d => d.dayOfWeek === 0) || week[0];
      if (firstDay) {
        const date = new Date(firstDay.date);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        if (month !== lastMonth && date.getDate() <= 7) {
          monthLabels.push({ month, weekIndex });
          lastMonth = month;
        }
      }
    });

    return { grid, maxCount, monthLabels };
  }, [dailyStats, weeks]);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-800';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return 'bg-pink-900';
    if (intensity <= 0.5) return 'bg-pink-700';
    if (intensity <= 0.75) return 'bg-pink-500';
    return 'bg-pink-400';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-xl border border-pink-500/20 bg-[#12121a] p-6">
      <h2 className="text-lg font-semibold text-white mb-2">Focus Activity</h2>
      <p className="text-sm text-gray-400 mb-4">Your pomodoro history over the last {weeks} weeks</p>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {monthLabels.map(({ month, weekIndex }, i) => (
              <div
                key={i}
                className="text-xs text-gray-500"
                style={{
                  position: 'relative',
                  left: `${weekIndex * 14}px`,
                  marginRight: i < monthLabels.length - 1
                    ? `${(monthLabels[i + 1].weekIndex - weekIndex - 1) * 14}px`
                    : '0',
                }}
              >
                {month}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col justify-between py-0.5 pr-1">
              {dayLabels.map((day, i) => (
                <div key={i} className="text-xs text-gray-500 h-3 leading-3">
                  {i % 2 === 1 ? day.charAt(0) : ''}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-0.5">
              {grid.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.5">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      className={`w-3 h-3 rounded-sm ${getColor(day.count)} cursor-pointer transition-transform hover:scale-125 group relative`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                        <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                          <p className="font-medium text-white">{formatDate(day.date)}</p>
                          {day.count > 0 ? (
                            <>
                              <p className="text-pink-400">{day.count} pomodoro{day.count !== 1 ? 's' : ''}</p>
                              <p className="text-gray-400">{formatMinutes(day.minutes)} focused</p>
                            </>
                          ) : (
                            <p className="text-gray-400">No pomodoros</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-400">
            <span>Less</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-gray-800" />
              <div className="w-3 h-3 rounded-sm bg-pink-900" />
              <div className="w-3 h-3 rounded-sm bg-pink-700" />
              <div className="w-3 h-3 rounded-sm bg-pink-500" />
              <div className="w-3 h-3 rounded-sm bg-pink-400" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
