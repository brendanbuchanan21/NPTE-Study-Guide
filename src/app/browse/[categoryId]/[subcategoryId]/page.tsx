'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { categories, subcategories, flashcards } from '@/lib/seed-data';
import { Flashcard } from '@/types';

interface BrowseSubcategoryPageProps {
  params: Promise<{ categoryId: string; subcategoryId: string }>;
}

export default function BrowseSubcategoryPage({ params }: BrowseSubcategoryPageProps) {
  const { categoryId, subcategoryId } = use(params);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const category = categories.find(c => c.id === categoryId);
  const subcategory = subcategories.find(s => s.id === subcategoryId);
  const cards = flashcards.filter(f => f.subcategory_id === subcategoryId) as Flashcard[];

  if (!category || !subcategory) {
    return (
      <div className="p-6">
        <p className="text-gray-400">Content not found</p>
        <Link href="/browse" className="text-pink-400 hover:underline">
          Back to browse
        </Link>
      </div>
    );
  }

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div>
      <Header
        title={subcategory.name}
        subtitle={`${cards.length} flashcards in ${category.name}`}
        action={
          <Link href="/browse" className="btn-secondary">
            Back to Browse
          </Link>
        }
      />

      <div className="p-4 sm:p-6">
        {/* Category breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/browse" className="text-gray-400 hover:text-pink-400">
            Browse
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400">{category.name}</span>
          <span className="text-gray-600">/</span>
          <span className="text-white">{subcategory.name}</span>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No flashcards in this subcategory yet.</p>
            <Link href="/browse" className="text-pink-400 hover:underline mt-2 inline-block">
              Browse other categories
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => toggleCard(card.id)}
                  className="w-full p-4 text-left flex items-start gap-4 hover:bg-white/5 transition-colors"
                >
                  <span className="text-pink-400 font-mono text-sm mt-0.5">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-medium">{card.front_text}</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedCard === card.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedCard === card.id && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="ml-10 p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
                      <p className="text-sm text-pink-400 font-medium mb-2">Answer:</p>
                      <p className="text-gray-200">{card.back_text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Study this subcategory button */}
        {cards.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href={`/study/${categoryId}`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              Study {category.name}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
