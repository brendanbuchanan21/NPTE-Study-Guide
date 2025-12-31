'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import FlashcardDeck from '@/components/flashcard/FlashcardDeck';
import { flashcards as allFlashcards, categories, subcategories } from '@/lib/seed-data';
import { Flashcard, ConfidenceRating } from '@/types';
import { calculateNextReview } from '@/lib/spaced-repetition';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_KEY = 'npte-study-session-mixed';

interface StudySession {
  currentIndex: number;
  studyStats: { studied: number; correct: number };
  shuffledIds: string[];
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MixedStudyPage() {
  const { user } = useAuth();
  const { progress, loading, saveProgress } = useProgress();

  const [isComplete, setIsComplete] = useState(false);
  const [studyStats, setStudyStats] = useState({ studied: 0, correct: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [cardCount, setCardCount] = useState(20);
  const [hasStarted, setHasStarted] = useState(false);

  // Get category info for a card
  const getCategoryForCard = useCallback((card: Flashcard) => {
    const subcategory = subcategories.find(s => s.id === card.subcategory_id);
    if (!subcategory) return null;
    return categories.find(c => c.id === subcategory.category_id);
  }, []);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const session: StudySession = JSON.parse(stored);
        setCurrentIndex(session.currentIndex);
        setStudyStats(session.studyStats);
        // Restore the shuffled order
        const cardMap = new Map(allFlashcards.map(c => [c.id, c]));
        const restored = session.shuffledIds
          .map(id => cardMap.get(id))
          .filter((c): c is Flashcard => c !== undefined);
        if (restored.length > 0) {
          setShuffledCards(restored);
          setHasStarted(true);
        }
      }
    } catch (error) {
      console.error('Error restoring study session:', error);
    }
    setInitialized(true);
  }, []);

  // Save session state
  const saveSession = useCallback((index: number, stats: { studied: number; correct: number }, cards: Flashcard[]) => {
    try {
      const session: StudySession = {
        currentIndex: index,
        studyStats: stats,
        shuffledIds: cards.map(c => c.id),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving study session:', error);
    }
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Error clearing study session:', error);
    }
  }, []);

  const handleStartStudy = () => {
    const shuffled = shuffleArray(allFlashcards as Flashcard[]).slice(0, cardCount);
    setShuffledCards(shuffled);
    setHasStarted(true);
    saveSession(0, { studied: 0, correct: 0 }, shuffled);
  };

  const handleCardReviewed = (
    flashcardId: string,
    rating: ConfidenceRating,
    result: ReturnType<typeof calculateNextReview>
  ) => {
    saveProgress(flashcardId, rating, result);

    const newStats = {
      studied: studyStats.studied + 1,
      correct: studyStats.correct + (rating !== 'again' ? 1 : 0),
    };
    setStudyStats(newStats);
  };

  const handleIndexChange = (newIndex: number) => {
    setCurrentIndex(newIndex);
    saveSession(newIndex, studyStats, shuffledCards);
  };

  const handleComplete = () => {
    setIsComplete(true);
    clearSession();
  };

  const handleRestart = () => {
    setIsComplete(false);
    setStudyStats({ studied: 0, correct: 0 });
    setCurrentIndex(0);
    setHasStarted(false);
    setShuffledCards([]);
    clearSession();
  };

  if (loading || !initialized) {
    return (
      <div>
        <Header
          title="Mixed Study"
          subtitle="Loading..."
        />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  // Setup screen - choose number of cards
  if (!hasStarted) {
    return (
      <div>
        <Header
          title="Mixed Study"
          subtitle="Study random cards from all categories"
          action={
            <Link href="/study" className="btn-secondary">
              Back to Categories
            </Link>
          }
        />
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="card p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-500 mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Mixed Study Session</h2>
              <p className="text-gray-400 mt-2">
                Cards will be randomly selected from all {allFlashcards.length} cards across {categories.length} categories.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                How many cards do you want to study?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50, 100].map((count) => (
                  <button
                    key={count}
                    onClick={() => setCardCount(count)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      cardCount === count
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Or study all {allFlashcards.length} cards
              </p>
              <button
                onClick={() => setCardCount(allFlashcards.length)}
                className={`mt-2 w-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  cardCount === allFlashcards.length
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                All Cards ({allFlashcards.length})
              </button>
            </div>

            <button
              onClick={handleStartStudy}
              className="btn-primary w-full"
            >
              Start Studying {cardCount} Cards
            </button>
          </div>
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
          title="Mixed Study"
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
              New Mixed Session
            </button>
            <Link
              href="/study"
              className="btn-secondary text-center w-full sm:w-auto"
            >
              Back to Categories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get category info for current card
  const currentCard = shuffledCards[currentIndex];
  const currentCategory = currentCard ? getCategoryForCard(currentCard) : null;

  return (
    <div>
      <Header
        title="Mixed Study"
        subtitle={currentCategory ? `Current: ${currentCategory.name}` : 'Random cards from all categories'}
        action={
          <Link href="/study" className="btn-secondary">
            Exit
          </Link>
        }
      />

      <div className="flex items-center justify-center py-8 px-4">
        <FlashcardDeck
          flashcards={shuffledCards}
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
