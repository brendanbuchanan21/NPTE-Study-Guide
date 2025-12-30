import Header from '@/components/layout/Header';
import Link from 'next/link';
import { categories, getFlashcardsForCategory } from '@/lib/seed-data';

export default function StudyPage() {
  return (
    <div>
      <Header
        title="Study"
        subtitle="Choose a category to start studying"
      />

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const cards = getFlashcardsForCategory(category.id);
            const cardCount = cards.length;

            return (
              <Link
                key={category.id}
                href={`/study/${category.id}`}
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
                      <span className="text-gray-400">{cardCount} cards</span>
                      {cardCount > 0 && (
                        <span className="text-pink-400">Ready to study</span>
                      )}
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
