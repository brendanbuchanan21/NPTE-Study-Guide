'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserFlashcardProgress, ConfidenceRating, SpacedRepetitionResult } from '@/types';
import { calculateNextReview } from '@/lib/spaced-repetition';

const LOCAL_STORAGE_KEY = 'npte-flashcard-progress';

interface ProgressMap {
  [flashcardId: string]: UserFlashcardProgress;
}

export function useProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Map<string, UserFlashcardProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load progress from localStorage or API
  useEffect(() => {
    async function loadProgress() {
      setLoading(true);

      if (user) {
        // Fetch from API when authenticated
        try {
          const response = await fetch('/api/progress');
          if (response.ok) {
            const data = await response.json();
            const progressMap = new Map<string, UserFlashcardProgress>();
            data.progress.forEach((p: UserFlashcardProgress) => {
              progressMap.set(p.flashcard_id, p);
            });
            setProgress(progressMap);
          }
        } catch (error) {
          console.error('Error loading progress:', error);
        }
      } else {
        // Load from localStorage when not authenticated
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            const parsed: ProgressMap = JSON.parse(stored);
            const progressMap = new Map<string, UserFlashcardProgress>();
            Object.entries(parsed).forEach(([id, p]) => {
              progressMap.set(id, p);
            });
            setProgress(progressMap);
          }
        } catch (error) {
          console.error('Error loading local progress:', error);
        }
      }

      setLoading(false);
    }

    loadProgress();
  }, [user]);

  // Save progress for a flashcard
  const saveProgress = useCallback(async (
    flashcardId: string,
    rating: ConfidenceRating,
    result: SpacedRepetitionResult
  ) => {
    const progressData: UserFlashcardProgress = {
      id: crypto.randomUUID(),
      user_id: user?.id || 'local',
      flashcard_id: flashcardId,
      ease_factor: result.ease_factor,
      interval: result.interval,
      repetitions: result.repetitions,
      next_review_date: result.next_review_date.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    };

    // Update local state immediately
    setProgress(prev => {
      const newMap = new Map(prev);
      newMap.set(flashcardId, progressData);
      return newMap;
    });

    if (user) {
      // Sync to API when authenticated
      setSyncing(true);
      try {
        await fetch('/api/progress/flashcard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flashcard_id: flashcardId,
            ease_factor: result.ease_factor,
            interval: result.interval,
            repetitions: result.repetitions,
            next_review_date: result.next_review_date.toISOString(),
          }),
        });
      } catch (error) {
        console.error('Error syncing progress:', error);
      } finally {
        setSyncing(false);
      }
    } else {
      // Save to localStorage when not authenticated
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed: ProgressMap = stored ? JSON.parse(stored) : {};
        parsed[flashcardId] = progressData;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      } catch (error) {
        console.error('Error saving local progress:', error);
      }
    }
  }, [user]);

  // Get progress for a specific flashcard
  const getProgress = useCallback((flashcardId: string): UserFlashcardProgress | null => {
    return progress.get(flashcardId) || null;
  }, [progress]);

  // Get all cards that are due for review
  const getDueCards = useCallback((flashcardIds: string[]): string[] => {
    const now = new Date();
    return flashcardIds.filter(id => {
      const p = progress.get(id);
      if (!p) return true; // New cards are due
      return new Date(p.next_review_date) <= now;
    });
  }, [progress]);

  return {
    progress,
    loading,
    syncing,
    saveProgress,
    getProgress,
    getDueCards,
  };
}
