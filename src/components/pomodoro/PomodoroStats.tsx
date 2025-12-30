'use client';

interface PomodoroStatsProps {
  todayCount: number;
  todayMinutes: number;
  totalCount: number;
  totalMinutes: number;
  weeklyAverage: number;
}

export default function PomodoroStats({
  todayCount,
  todayMinutes,
  totalCount,
  totalMinutes,
  weeklyAverage,
}: PomodoroStatsProps) {
  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const stats = [
    {
      label: 'Today',
      value: todayCount,
      subValue: formatMinutes(todayMinutes),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'This Week',
      value: weeklyAverage.toFixed(1),
      subValue: 'daily avg',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Total Pomodoros',
      value: totalCount,
      subValue: formatHours(totalMinutes),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-pink-500/20 bg-[#12121a] p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Pomodoro Stats</h2>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-pink-500/10 text-pink-400 mb-2">
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
            <div className="text-xs text-pink-400">{stat.subValue}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
