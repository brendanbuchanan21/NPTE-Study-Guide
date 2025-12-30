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

        <h2 className="mb-4 text-lg font-semibold text-white">Select a Category</h2>

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
