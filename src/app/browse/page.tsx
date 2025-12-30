import Header from '@/components/layout/Header';
import Link from 'next/link';
import { categories, subcategories, flashcards } from '@/lib/seed-data';

export default function BrowsePage() {
  return (
    <div>
      <Header
        title="Browse Content"
        subtitle="Explore all flashcards and categories"
      />

      <div className="p-4 sm:p-6">
        {categories.map((category) => {
          const categorySubs = subcategories.filter(s => s.category_id === category.id);
          const categoryCards = flashcards.filter(f =>
            categorySubs.some(s => s.id === f.subcategory_id)
          );

          return (
            <div key={category.id} className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}30`, border: `2px solid ${category.color}` }}
                >
                  <div
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                </div>
                <h2 className="text-xl font-semibold text-white">{category.name}</h2>
                <span className="text-sm text-gray-500">
                  ({categoryCards.length} cards)
                </span>
              </div>

              {categorySubs.length > 0 ? (
                <div className="ml-11 space-y-2">
                  {categorySubs.map((sub) => {
                    const subCards = flashcards.filter(f => f.subcategory_id === sub.id);
                    return (
                      <Link
                        key={sub.id}
                        href={`/browse/${category.id}/${sub.id}`}
                        className="block card p-3 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white group-hover:text-pink-400 transition-colors">{sub.name}</span>
                          <span className="text-sm text-gray-500">
                            {subCards.length} cards
                          </span>
                        </div>
                        {sub.description && (
                          <p className="mt-1 text-sm text-gray-500">{sub.description}</p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="ml-11 text-sm text-gray-500">
                  No subcategories yet. Content will be added soon.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
