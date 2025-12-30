'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface QuestionHistory {
  id: string;
  user_id: string;
  question_id: string;
  selected_answer: number;
  is_correct: boolean;
  answered_at: string;
}

interface QuizSession {
  categoryId: string;
  currentIndex: number;
  score: { correct: number; total: number };
  answeredQuestions: { [questionId: string]: number }; // questionId -> selected answer
}

const LOCAL_STORAGE_KEY = 'npte-quiz-progress';
const SESSION_STORAGE_KEY = 'npte-quiz-session';

export function useQuizProgress(categoryId?: string) {
  const { user } = useAuth();
  const [history, setHistory] = useState<Map<string, QuestionHistory[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [session, setSession] = useState<QuizSession | null>(null);

  // Load history and session on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Load session state from sessionStorage (persists within tab/browser session)
      if (categoryId) {
        try {
          const storedSession = sessionStorage.getItem(`${SESSION_STORAGE_KEY}-${categoryId}`);
          if (storedSession) {
            const parsed = JSON.parse(storedSession);
            setSession(parsed);
          }
        } catch (error) {
          console.error('Error loading session:', error);
        }
      }

      if (user) {
        // Fetch history from API
        try {
          const response = await fetch('/api/progress/question');
          if (response.ok) {
            const data = await response.json();
            const historyMap = new Map<string, QuestionHistory[]>();
            data.history.forEach((h: QuestionHistory) => {
              const existing = historyMap.get(h.question_id) || [];
              existing.push(h);
              historyMap.set(h.question_id, existing);
            });
            setHistory(historyMap);
          }
        } catch (error) {
          console.error('Error loading question history:', error);
        }
      } else {
        // Load from localStorage for anonymous users
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            const parsed: { [key: string]: QuestionHistory[] } = JSON.parse(stored);
            const historyMap = new Map<string, QuestionHistory[]>();
            Object.entries(parsed).forEach(([id, entries]) => {
              historyMap.set(id, entries);
            });
            setHistory(historyMap);
          }
        } catch (error) {
          console.error('Error loading local question history:', error);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [user, categoryId]);

  // Save an answer
  const saveAnswer = useCallback(async (
    questionId: string,
    selectedAnswer: number,
    isCorrect: boolean
  ) => {
    const historyEntry: QuestionHistory = {
      id: crypto.randomUUID(),
      user_id: user?.id || 'local',
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
    };

    // Update local state immediately
    setHistory(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(questionId) || [];
      newMap.set(questionId, [...existing, historyEntry]);
      return newMap;
    });

    if (user) {
      // Sync to API
      setSyncing(true);
      try {
        await fetch('/api/progress/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: questionId,
            selected_answer: selectedAnswer,
            is_correct: isCorrect,
          }),
        });
      } catch (error) {
        console.error('Error syncing question history:', error);
      } finally {
        setSyncing(false);
      }
    } else {
      // Save to localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed: { [key: string]: QuestionHistory[] } = stored ? JSON.parse(stored) : {};
        const existing = parsed[questionId] || [];
        parsed[questionId] = [...existing, historyEntry];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      } catch (error) {
        console.error('Error saving local question history:', error);
      }
    }
  }, [user]);

  // Save session state (position in quiz)
  const saveSession = useCallback((sessionData: QuizSession) => {
    setSession(sessionData);
    try {
      sessionStorage.setItem(
        `${SESSION_STORAGE_KEY}-${sessionData.categoryId}`,
        JSON.stringify(sessionData)
      );
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, []);

  // Clear session (when quiz is completed or restarted)
  const clearSession = useCallback((catId?: string) => {
    const targetId = catId || categoryId;
    setSession(null);
    if (targetId) {
      try {
        sessionStorage.removeItem(`${SESSION_STORAGE_KEY}-${targetId}`);
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    }
  }, [categoryId]);

  // Get history for a specific question
  const getQuestionHistory = useCallback((questionId: string): QuestionHistory[] => {
    return history.get(questionId) || [];
  }, [history]);

  // Get last answer for a question
  const getLastAnswer = useCallback((questionId: string): QuestionHistory | null => {
    const entries = history.get(questionId);
    if (!entries || entries.length === 0) return null;
    return entries[entries.length - 1];
  }, [history]);

  // Get accuracy for a set of questions
  const getAccuracy = useCallback((questionIds: string[]): { correct: number; total: number; percentage: number } => {
    let correct = 0;
    let total = 0;

    questionIds.forEach(id => {
      const entries = history.get(id);
      if (entries && entries.length > 0) {
        // Use most recent answer
        const lastEntry = entries[entries.length - 1];
        total++;
        if (lastEntry.is_correct) correct++;
      }
    });

    return {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }, [history]);

  return {
    history,
    loading,
    syncing,
    session,
    saveAnswer,
    saveSession,
    clearSession,
    getQuestionHistory,
    getLastAnswer,
    getAccuracy,
  };
}
