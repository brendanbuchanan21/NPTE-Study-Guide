import Header from '@/components/layout/Header';
import Link from 'next/link';
import { categories, questions, subcategories } from '@/lib/seed-data';

export default function QuizPage() {
  // Count questions per category
  const getQuestionCount = (categoryId: string) => {
    const categorySubs = subcategories.filter(s => s.category_id === categoryId);
    return questions.filter(q => categorySubs.some(s => s.id === q.subcategory_id)).length;
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
                    <div className="mt-3">
                      <span className="text-sm text-gray-400">{questionCount} questions</span>
                    </div>
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
