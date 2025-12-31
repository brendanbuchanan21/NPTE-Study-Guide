'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import FlashcardDeck from '@/components/flashcard/FlashcardDeck';
import { categories, getFlashcardsForCategory } from '@/lib/seed-data';
import { Flashcard, ConfidenceRating } from '@/types';
import { calculateNextReview } from '@/lib/spaced-repetition';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_KEY = 'npte-study-session';

interface StudySession {
  categoryId: string;
  currentIndex: number;
  studyStats: { studied: number; correct: number };
}

interface StudyCategoryPageProps {
  params: Promise<{ categoryId: string }>;
}

export default function StudyCategoryPage({ params }: StudyCategoryPageProps) {
  const { categoryId } = use(params);
  const { user } = useAuth();
  const { progress, loading, saveProgress } = useProgress();
  const category = categories.find(c => c.id === categoryId);
  const flashcards = getFlashcardsForCategory(categoryId) as Flashcard[];

  const [isComplete, setIsComplete] = useState(false);
  const [studyStats, setStudyStats] = useState({ studied: 0, correct: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`${SESSION_KEY}-${categoryId}`);
      if (stored) {
        const session: StudySession = JSON.parse(stored);
        if (session.categoryId === categoryId) {
          setCurrentIndex(session.currentIndex);
          setStudyStats(session.studyStats);
        }
      }
    } catch (error) {
      console.error('Error restoring study session:', error);
    }
    setInitialized(true);
  }, [categoryId]);

  // Save session state
  const saveSession = useCallback((index: number, stats: { studied: number; correct: number }) => {
    try {
      const session: StudySession = {
        categoryId,
        currentIndex: index,
        studyStats: stats,
      };
      sessionStorage.setItem(`${SESSION_KEY}-${categoryId}`, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving study session:', error);
    }
  }, [categoryId]);

  // Clear session
  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(`${SESSION_KEY}-${categoryId}`);
    } catch (error) {
      console.error('Error clearing study session:', error);
    }
  }, [categoryId]);

  const handleCardReviewed = (
    flashcardId: string,
    rating: ConfidenceRating,
    result: ReturnType<typeof calculateNextReview>
  ) => {
    // Save progress (to Supabase if authenticated, localStorage otherwise)
    saveProgress(flashcardId, rating, result);

    // Update stats
    const newStats = {
      studied: studyStats.studied + 1,
      correct: studyStats.correct + (rating !== 'again' ? 1 : 0),
    };
    setStudyStats(newStats);

    // Save session with new stats immediately
    saveSession(currentIndex, newStats);
  };

  const handleIndexChange = (newIndex: number) => {
    setCurrentIndex(newIndex);
    // Save session with current stats and new index
    saveSession(newIndex, studyStats);
  };

  const handleComplete = () => {
    setIsComplete(true);
    clearSession();
  };

  const handleRestart = () => {
    setIsComplete(false);
    setStudyStats({ studied: 0, correct: 0 });
    setCurrentIndex(0);
    clearSession();
  };

  if (!category) {
    return (
      <div className="p-6">
        <p className="text-gray-400">Category not found</p>
        <Link href="/study" className="text-pink-400 hover:underline">
          Back to categories
        </Link>
      </div>
    );
  }

  if (loading || !initialized) {
    return (
      <div>
        <Header
          title={category.name}
          subtitle="Loading..."
        />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div>
        <Header
          title={category.name}
          subtitle="Study flashcards"
          action={
            <Link
              href="/study"
              className="btn-secondary"
            >
              Back to Categories
            </Link>
          }
        />
        <div className="flex flex-col items-center justify-center py-24">
          <div
            className="mb-4 h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${category.color}30`, border: `2px solid ${category.color}` }}
          >
            <div
              className="h-8 w-8 rounded-lg"
              style={{ backgroundColor: category.color }}
            />
          </div>
          <h2 className="text-xl font-semibold text-white">No cards yet</h2>
          <p className="mt-2 text-gray-500">
            Flashcards will be added once content is uploaded.
          </p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const accuracy = studyStats.studied > 0
      ? Math.round((studyStats.correct / studyStats.studied) * 100)
      : 0;

    return (
      <div>
        <Header
          title={category.name}
          subtitle="Study session complete!"
        />
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-8 text-6xl">
            {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '📚'}
          </div>
          <h2 className="text-2xl font-bold text-white">Session Complete!</h2>
          <p className="mt-2 text-gray-400">
            You studied {studyStats.studied} cards with {accuracy}% accuracy.
          </p>
          {user && (
            <p className="mt-1 text-sm text-green-400">
              Progress saved to your account
            </p>
          )}
          {!user && (
            <p className="mt-1 text-sm text-amber-400">
              Progress saved locally. Sign in to sync across devices.
            </p>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
            <button
              onClick={handleRestart}
              className="btn-primary w-full sm:w-auto"
            >
              Study Again
            </button>
            <Link
              href="/study"
              className="btn-secondary text-center w-full sm:w-auto"
            >
              Choose Another Category
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={category.name}
        subtitle={`${flashcards.length} cards to study`}
        action={
          <Link
            href="/study"
            className="btn-secondary"
          >
            Back to Categories
          </Link>
        }
      />

      <div className="flex items-center justify-center py-8 px-4">
        <FlashcardDeck
          flashcards={flashcards}
          progressMap={progress}
          onCardReviewed={handleCardReviewed}
          onComplete={handleComplete}
          initialIndex={currentIndex}
          onIndexChange={handleIndexChange}
        />
      </div>
    </div>
  );
}
