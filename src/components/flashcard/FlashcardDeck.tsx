'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Touch handling for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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
    setSwipeDirection(rating === 'again' ? 'left' : 'right');
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
      setSwipeDirection(null);
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

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (!isFlipped || isAnimating) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Only trigger swipe if horizontal movement is greater than vertical
    // and the swipe distance is significant (> 50px)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right = Know
        handleRate('good');
      } else {
        // Swipe left = Don't Know
        handleRate('again');
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [isFlipped, isAnimating, handleRate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys for navigation when not flipped
      if (!isFlipped) {
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
      }

      // When flipped, arrow keys rate the card
      if (isFlipped) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleRate('again'); // Don't Know
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleRate('good'); // Know
          return;
        }
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

  // Swipe animation classes
  const getSwipeClass = () => {
    if (!swipeDirection) return '';
    return swipeDirection === 'left'
      ? 'animate-swipe-left'
      : 'animate-swipe-right';
  };

  return (
    <div className="flex flex-col items-center gap-6 px-4 w-full max-w-3xl mx-auto">
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

      {/* Flashcard with swipe support */}
      <div
        ref={cardRef}
        className={`w-full transition-transform duration-300 ${getSwipeClass()}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <FlashCard
          flashcard={currentCard}
          onFlip={setIsFlipped}
        />
      </div>

      {/* Know/Don't Know buttons - only show when flipped */}
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
            Press <kbd className="rounded bg-[#1a1a24] border border-pink-500/20 px-2 py-1 text-pink-400">Space</kbd> to flip
          </p>
          <p>
            Use <kbd className="rounded bg-[#1a1a24] border border-pink-500/20 px-2 py-1 text-pink-400">←</kbd> <kbd className="rounded bg-[#1a1a24] border border-pink-500/20 px-2 py-1 text-pink-400">→</kbd> to navigate
          </p>
        </div>
      )}
      {isFlipped && (
        <div className="text-sm text-gray-500 text-center">
          <p>
            <kbd className="rounded bg-[#1a1a24] border border-pink-500/20 px-2 py-1 text-pink-400">←</kbd> Don&apos;t Know
            {' '}&bull;{' '}
            <kbd className="rounded bg-[#1a1a24] border border-pink-500/20 px-2 py-1 text-pink-400">→</kbd> Know
          </p>
        </div>
      )}
    </div>
  );
}
