import { ConfidenceRating, SpacedRepetitionResult, UserFlashcardProgress } from '@/types';

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on the SuperMemo SM-2 algorithm with modifications for our 4-button system:
 * - Again (0): Complete reset, review again soon
 * - Hard (1): Incorrect but close, shorter interval
 * - Good (2): Correct with effort, normal interval
 * - Easy (3): Perfect recall, longer interval
 */

const RATING_VALUES: Record<ConfidenceRating, number> = {
  again: 0,
  hard: 1,
  good: 2,
  easy: 3,
};

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

export function calculateNextReview(
  currentProgress: UserFlashcardProgress | null,
  rating: ConfidenceRating
): SpacedRepetitionResult {
  const q = RATING_VALUES[rating];

  // Get current values or defaults
  let easeFactor = currentProgress?.ease_factor ?? DEFAULT_EASE_FACTOR;
  let repetitions = currentProgress?.repetitions ?? 0;
  let interval = currentProgress?.interval ?? 0;

  // Calculate new ease factor
  // EF' = EF + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02))
  const newEaseFactor = easeFactor + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02));
  easeFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  // Handle based on rating
  if (q < 1) {
    // Again - reset repetitions, short interval
    repetitions = 0;
    interval = 1; // Review in 1 day (or could be minutes for same-session)
  } else if (q === 1) {
    // Hard - don't reset, but use shorter interval
    repetitions = Math.max(0, repetitions);
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 4;
    } else {
      interval = Math.round(interval * easeFactor * 0.8);
    }
  } else {
    // Good or Easy - increment repetitions
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    // Easy bonus - 1.3x interval
    if (q === 3) {
      interval = Math.round(interval * 1.3);
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    ease_factor: easeFactor,
    interval,
    repetitions,
    next_review_date: nextReviewDate,
  };
}

export function getCardsForReview(
  allProgress: UserFlashcardProgress[],
  limit: number = 20
): string[] {
  const now = new Date();

  // Filter cards that are due
  const dueCards = allProgress.filter(p => {
    const nextReview = new Date(p.next_review_date);
    return nextReview <= now;
  });

  // Sort by overdue amount (most overdue first)
  dueCards.sort((a, b) => {
    const aDate = new Date(a.next_review_date);
    const bDate = new Date(b.next_review_date);
    return aDate.getTime() - bDate.getTime();
  });

  return dueCards.slice(0, limit).map(p => p.flashcard_id);
}

export function getNewCards(
  allFlashcardIds: string[],
  progressMap: Map<string, UserFlashcardProgress>,
  limit: number = 10
): string[] {
  // Cards without any progress entry
  const newCards = allFlashcardIds.filter(id => !progressMap.has(id));
  return newCards.slice(0, limit);
}

export function formatNextReviewText(nextReviewDate: Date): string {
  const now = new Date();
  const diffMs = nextReviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'Due now';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays < 7) {
    return `Due in ${diffDays} days`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Due in ${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `Due in ${months} month${months > 1 ? 's' : ''}`;
  }
}

export function getConfidenceIntervals(
  currentProgress: UserFlashcardProgress | null
): Record<ConfidenceRating, number> {
  return {
    again: calculateNextReview(currentProgress, 'again').interval,
    hard: calculateNextReview(currentProgress, 'hard').interval,
    good: calculateNextReview(currentProgress, 'good').interval,
    easy: calculateNextReview(currentProgress, 'easy').interval,
  };
}
