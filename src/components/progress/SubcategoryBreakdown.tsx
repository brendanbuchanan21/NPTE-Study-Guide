'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SubcategoryStats {
  id: string;
  categoryId: string;
  name: string;
  totalCards: number;
  cardsLearned: number;
  cardsDue: number;
}

interface CategoryInfo {
  id: string;
  name: string;
  color: string;
}

interface SubcategoryBreakdownProps {
  subcategories: SubcategoryStats[];
  categories: CategoryInfo[];
}

export default function SubcategoryBreakdown({
  subcategories,
  categories,
}: SubcategoryBreakdownProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  const filteredSubcategories = selectedCategory === 'all'
    ? subcategories
    : subcategories.filter(s => s.categoryId === selectedCategory);

  const getCategoryColor = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.color || '#3B82F6';
  };

  return (
    <div className="rounded-xl border border-pink-500/20 bg-[#12121a] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Subcategory Breakdown</h2>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-[#1a1a24] border border-pink-500/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-pink-500"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSubcategories.map((subcategory) => {
          const progress = subcategory.totalCards > 0
            ? Math.round((subcategory.cardsLearned / subcategory.totalCards) * 100)
            : 0;

          return (
            <Link
              key={subcategory.id}
              href={`/study/${subcategory.categoryId}`}
              className="group"
            >
              <div className="p-4 rounded-lg border border-gray-800 hover:border-pink-500/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getCategoryColor(subcategory.categoryId) }}
                    />
                    <span className="text-sm text-white group-hover:text-pink-400 transition-colors truncate">
                      {subcategory.name}
                    </span>
                  </div>
                  {subcategory.cardsDue > 0 && (
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                      {subcategory.cardsDue} due
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {subcategory.cardsLearned}/{subcategory.totalCards}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredSubcategories.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No subcategories found.</p>
        </div>
      )}
    </div>
  );
}
