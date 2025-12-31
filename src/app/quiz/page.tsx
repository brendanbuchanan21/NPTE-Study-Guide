'use client';

import Header from '@/components/layout/Header';
import Link from 'next/link';
import { categories, questions, subcategories } from '@/lib/seed-data';
import { useQuizProgress } from '@/hooks/useQuizProgress';

export default function QuizPage() {
  const { history, loading } = useQuizProgress();

  // Count questions per category
  const getQuestionCount = (categoryId: string) => {
    const categorySubs = subcategories.filter(s => s.category_id === categoryId);
    return questions.filter(q => categorySubs.some(s => s.id === q.subcategory_id)).length;
  };

  // Get total quiz progress
  const getTotalQuizProgress = () => {
    let answered = 0;
    let correct = 0;

    questions.forEach(q => {
      const entries = history.get(q.id);
      if (entries && entries.length > 0) {
        answered++;
        if (entries[entries.length - 1].is_correct) {
          correct++;
        }
      }
    });

    return { answered, correct, total: questions.length };
  };

  // Get quiz progress for a category
  const getCategoryQuizProgress = (categoryId: string) => {
    const categorySubs = subcategories.filter(s => s.category_id === categoryId);
    const categoryQuestions = questions.filter(q => categorySubs.some(s => s.id === q.subcategory_id));
    const questionIds = categoryQuestions.map(q => q.id);

    let answered = 0;
    let correct = 0;

    questionIds.forEach(qId => {
      const entries = history.get(qId);
      if (entries && entries.length > 0) {
        answered++;
        // Use most recent answer
        if (entries[entries.length - 1].is_correct) {
          correct++;
        }
      }
    });

    return { answered, correct, total: categoryQuestions.length };
  };

  const totalStats = loading ? { answered: 0, correct: 0, total: questions.length } : getTotalQuizProgress();
  const totalAccuracy = totalStats.answered > 0 ? Math.round((totalStats.correct / totalStats.answered) * 100) : 0;

  return (
    <div>
      <Header
        title="Quiz Mode"
        subtitle="Test your knowledge with practice questions"
      />

      <div className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-6 rounded-lg bg-pink-500/10 border border-pink-500/20 p-3 sm:p-4">
          <h3 className="font-medium text-pink-400">About Quiz Mode</h3>
          <p className="mt-1 text-sm text-gray-400">
            Practice NPTE-style multiple choice questions. Each question has an explanation
            to help you learn from both correct and incorrect answers.
          </p>
        </div>

        {/* Mixed Quiz Option */}
        <div className="mb-6">
          <Link
            href="/quiz/mixed"
            className="card p-6 group block border-2 border-dashed border-pink-500/30 hover:border-pink-500/60 bg-gradient-to-br from-pink-500/5 to-purple-500/5"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg transition-transform group-hover:scale-110 flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-500">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-pink-400 transition-colors">Mixed Quiz</h3>
                <p className="mt-1 text-sm text-gray-500">Random questions from all categories - simulate the real exam</p>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="text-gray-400">{totalStats.answered}/{totalStats.total} answered</span>
                  {totalStats.answered > 0 && (
                    <span className={totalAccuracy >= 70 ? 'text-green-400' : 'text-amber-400'}>
                      {totalAccuracy}% correct
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                {totalStats.total > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${(totalStats.answered / totalStats.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>

        <h2 className="mb-4 text-lg font-semibold text-white">By Category</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const questionCount = getQuestionCount(category.id);
            const { answered, correct, total } = loading
              ? { answered: 0, correct: 0, total: questionCount }
              : getCategoryQuizProgress(category.id);
            const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

            return (
              <Link
                key={category.id}
                href={`/quiz/${category.id}`}
                className="card p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="h-12 w-12 rounded-lg transition-transform group-hover:scale-110 flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}30`, border: `2px solid ${category.color}` }}
                  >
                    <div
                      className="h-6 w-6 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-pink-400 transition-colors">{category.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{answered}/{total} answered</span>
                      {answered > 0 && (
                        <span className={accuracy >= 70 ? 'text-green-400' : 'text-amber-400'}>
                          {accuracy}% correct
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    {total > 0 && (
                      <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-500 rounded-full transition-all"
                          style={{ width: `${(answered / total) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
