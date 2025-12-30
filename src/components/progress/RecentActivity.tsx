'use client';

interface QuestionHistoryItem {
  id: string;
  question_id: string;
  selected_answer: number;
  is_correct: boolean;
  answered_at: string;
}

interface RecentActivityProps {
  history: QuestionHistoryItem[];
}

export default function RecentActivity({ history }: RecentActivityProps) {
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="rounded-xl border border-pink-500/20 bg-[#12121a] p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Recent Quiz Activity</h2>

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No quiz activity yet.</p>
          <p className="text-sm mt-1">Complete some quizzes to see your history!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a24] border border-gray-800"
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  item.is_correct
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {item.is_correct ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  Question #{item.question_id.slice(-4)}
                </p>
                <p className={`text-xs ${item.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                  {item.is_correct ? 'Correct' : 'Incorrect'}
                </p>
              </div>

              <span className="text-xs text-gray-500">
                {formatTimeAgo(item.answered_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
