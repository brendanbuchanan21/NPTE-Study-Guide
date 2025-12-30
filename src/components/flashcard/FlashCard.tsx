'use client';

import { useState, useEffect, useCallback } from 'react';
import { Flashcard } from '@/types';

interface FlashCardProps {
  flashcard: Flashcard;
  onFlip?: (isFlipped: boolean) => void;
}

export default function FlashCard({ flashcard, onFlip }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => {
      const newFlipped = !prev;
      onFlip?.(newFlipped);
      return newFlipped;
    });
  }, [onFlip]);

  // Reset flip state when flashcard changes
  useEffect(() => {
    setIsFlipped(false);
    onFlip?.(false);
  }, [flashcard.id]);

  // Global keyboard listener for spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip]);

  const handleLocalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleFlip();
    }
  };

  return (
    <div
      className="perspective-1000 w-full cursor-pointer"
      style={{ minHeight: '320px', height: 'auto' }}
      onClick={handleFlip}
      onKeyDown={handleLocalKeyDown}
      tabIndex={0}
      role="button"
      aria-label={isFlipped ? 'Show question' : 'Show answer'}
    >
      <div
        className={`relative w-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ minHeight: '320px' }}
      >
        {/* Front (Question) */}
        <div className="absolute inset-0 backface-hidden">
          <div className="flex min-h-[320px] h-full flex-col rounded-2xl bg-[#12121a] border border-pink-500/20 p-6 sm:p-8 shadow-lg hover:border-pink-500/40 transition-all">
            <div className="flex flex-1 items-center justify-center overflow-auto">
              <p className="text-center text-base sm:text-lg md:text-xl font-medium text-gray-100 whitespace-pre-wrap break-words max-w-full">
                {flashcard.front_text}
              </p>
            </div>
            <div className="flex items-center justify-center pt-4 text-sm text-pink-400/60">
              <span>Click or press space to flip</span>
            </div>
          </div>
        </div>

        {/* Back (Answer) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="flex min-h-[320px] h-full flex-col rounded-2xl bg-gradient-to-br from-pink-600 to-pink-700 p-6 sm:p-8 shadow-lg glow-pink-strong">
            <div className="flex flex-1 items-center justify-center overflow-auto">
              <p className="text-center text-base sm:text-lg md:text-xl font-medium text-white whitespace-pre-wrap break-words max-w-full">
                {flashcard.back_text}
              </p>
            </div>
            <div className="flex items-center justify-center pt-4 text-sm text-pink-200/70">
              <span>Click to flip back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
