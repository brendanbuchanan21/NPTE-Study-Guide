'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface OverviewStats {
  currentStreak: number;
  longestStreak: number;
  cardsLearned: number;
  cardsDue: number;
  totalCards: number;
  questionsAnswered: number;
  accuracy: number;
}

interface CategoryPerformance {
  id: string;
  name: string;
  color: string;
  totalCards: number;
  cardsLearned: number;
  cardsDue: number;
  performanceScore: number;
  avgEaseFactor: number;
}

interface SubcategoryStats {
  id: string;
  categoryId: string;
  name: string;
  totalCards: number;
  cardsLearned: number;
  cardsDue: number;
}

interface DayTrend {
  date: string;
  cardsStudied: number;
  accuracy: number | null;
}

interface OverdueCard {
  id: string;
  front: string;
  dueDate: string;
  daysOverdue: number;
}

interface QuestionHistoryItem {
  id: string;
  question_id: string;
  selected_answer: number;
  is_correct: boolean;
  answered_at: string;
}

interface AnalyticsData {
  overview: OverviewStats;
  categoryPerformance: CategoryPerformance[];
  subcategoryBreakdown: SubcategoryStats[];
  trend: DayTrend[];
  overdueCards: OverdueCard[];
  recentHistory: QuestionHistoryItem[];
}

export function useAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
