'use client';

import { useState, useEffect, useCallback } from 'react';
import FlashCard from './FlashCard';
import ConfidenceButtons from './ConfidenceButtons';
import { Flashcard, ConfidenceRating, UserFlashcardProgress } from '@/types';
import { calculateNextReview, getConfidenceIntervals } from '@/lib/spaced-repetition';

interface FlashcardDeckProps {
  flashcards: Flashcard[];
  progressMap: Map<string, UserFlashcardProgress>;
  onCardReviewed: (flashcardId: string, rating: ConfidenceRating, result: ReturnType<typeof calculateNextReview>) => void;
  onComplete: () => void;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

export default function FlashcardDeck({
  flashcards,
  progressMap,
  onCardReviewed,
  onComplete,
  initialIndex = 0,
  onIndexChange,
}: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync with initialIndex when it changes (for session restore)
  useEffect(() => {
    if (initialIndex !== currentIndex && initialIndex < flashcards.length) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex]);

  const currentCard = flashcards[currentIndex];
  const currentProgress = currentCard ? progressMap.get(currentCard.id) ?? null : null;
  const intervals = currentProgress !== undefined ? getConfidenceIntervals(currentProgress) : undefined;

  const handleRate = useCallback((rating: ConfidenceRating) => {
    if (!currentCard || isAnimating) return;

    setIsAnimating(true);
    const result = calculateNextReview(currentProgress, rating);
    onCardReviewed(currentCard.id, rating, result);

    // Animate to next card
    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
        onIndexChange?.(nextIndex);
      } else {
        onComplete();
      }
      setIsAnimating(false);
    }, 300);
  }, [currentCard, currentProgress, currentIndex, flashcards.length, isAnimating, onCardReviewed, onComplete, onIndexChange]);

  // Navigate to previous card
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0 && !isAnimating) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setIsFlipped(false);
      onIndexChange?.(prevIndex);
    }
  }, [currentIndex, isAnimating, onIndexChange]);

  // Navigate to next card (without rating)
  const goToNext = useCallback(() => {
    if (currentIndex < flashcards.length - 1 && !isAnimating) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      onIndexChange?.(nextIndex);
    }
  }, [currentIndex, flashcards.length, isAnimating, onIndexChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys for navigation (work anytime)
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
        return;
      }

      // Number keys for rating (only when flipped)
      if (!isFlipped) return;

      switch (e.key) {
        case '1':
          handleRate('again');
          break;
        case '2':
          handleRate('hard');
          break;
        case '3':
          handleRate('good');
          break;
        case '4':
          handleRate('easy');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleRate, goToPrevious, goToNext]);

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-xl text-gray-400">No cards to review!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 px-4 w-full max-w-3xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 w-full justify-center">
        <span className="text-sm text-gray-400">
          Card {currentIndex + 1} of {flashcards.length}
        </span>
        <div className="h-2 w-48 progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="w-full">
        <FlashCard
          flashcard={currentCard}
          onFlip={setIsFlipped}
        />
      </div>

      {/* Confidence buttons - only show when flipped */}
      <div className={`transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <ConfidenceButtons
          onRate={handleRate}
          intervals={intervals}
          disabled={isAnimating || !isFlipped}
        />
      </div>

      {/* Instructions */}
      {!isFlipped && (
        <div className="text-sm text-gray-500 text-center space-y-1">
          <p>
            Press <kbd className="rounded bg-[#1a1a24] border border-pink-500/20 px-2 py-1 text-pink-400">Space</kbd> to flip the card
          </p>
          <p>
            Use <kbd className="rounded bg-[#1a1a24] border border-pink-500/20 px-2 py-1 text-pink-400">←</kbd> <kbd className="rounded bg-[#1a1a24] border border-pink-500/20 px-2 py-1 text-pink-400">→</kbd> to navigate
          </p>
        </div>
      )}
    </div>
  );
}
