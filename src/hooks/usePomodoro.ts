'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PomodoroSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  completed_at: string;
  session_date: string;
}

interface DailyStats {
  count: number;
  minutes: number;
}

interface PomodoroStats {
  today: DailyStats;
  total: DailyStats;
  weeklyAverage: number;
  dailyStats: Record<string, DailyStats>;
  sessions: PomodoroSession[];
}

const LOCAL_STORAGE_KEY = 'npte-pomodoro-sessions';

export function usePomodoro() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<PomodoroStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch stats from API or localStorage
  const fetchStats = useCallback(async () => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    setLoading(true);

    if (user) {
      try {
        const response = await fetch('/api/pomodoro?days=120');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching pomodoro stats:', error);
      }
    } else {
      // Load from localStorage for anonymous users
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const sessions: PomodoroSession[] = JSON.parse(stored);
          const today = new Date().toISOString().split('T')[0];

          // Calculate stats from local sessions
          const todaySessions = sessions.filter(s => s.session_date === today);
          const dailyStats: Record<string, DailyStats> = {};

          sessions.forEach(session => {
            const date = session.session_date;
            if (!dailyStats[date]) {
              dailyStats[date] = { count: 0, minutes: 0 };
            }
            dailyStats[date].count++;
            dailyStats[date].minutes += session.duration_minutes;
          });

          // Weekly average
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekAgoStr = weekAgo.toISOString().split('T')[0];
          const weekSessions = sessions.filter(s => s.session_date >= weekAgoStr);
          const weeklyAvg = weekSessions.length > 0 ? Math.round(weekSessions.length / 7 * 10) / 10 : 0;

          setStats({
            today: {
              count: todaySessions.length,
              minutes: todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0),
            },
            total: {
              count: sessions.length,
              minutes: sessions.reduce((sum, s) => sum + s.duration_minutes, 0),
            },
            weeklyAverage: weeklyAvg,
            dailyStats,
            sessions: sessions.slice(0, 50),
          });
        } else {
          setStats({
            today: { count: 0, minutes: 0 },
            total: { count: 0, minutes: 0 },
            weeklyAverage: 0,
            dailyStats: {},
            sessions: [],
          });
        }
      } catch (error) {
        console.error('Error loading local pomodoro sessions:', error);
      }
    }

    setLoading(false);
  }, [user, authLoading]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Save a completed pomodoro session
  const saveSession = useCallback(async (durationMinutes: number) => {
    const today = new Date().toISOString().split('T')[0];

    if (user) {
      // Save to API
      try {
        const response = await fetch('/api/pomodoro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration_minutes: durationMinutes }),
        });

        if (response.ok) {
          // Refresh stats
          fetchStats();
        }
      } catch (error) {
        console.error('Error saving pomodoro session:', error);
      }
    } else {
      // Save to localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const sessions: PomodoroSession[] = stored ? JSON.parse(stored) : [];

        const newSession: PomodoroSession = {
          id: crypto.randomUUID(),
          user_id: 'local',
          duration_minutes: durationMinutes,
          completed_at: new Date().toISOString(),
          session_date: today,
        };

        sessions.unshift(newSession);

        // Keep only last 365 days of sessions
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 365);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];
        const filteredSessions = sessions.filter(s => s.session_date >= cutoffStr);

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredSessions));

        // Refresh stats
        fetchStats();
      } catch (error) {
        console.error('Error saving local pomodoro session:', error);
      }
    }
  }, [user, fetchStats]);

  return {
    stats,
    loading,
    saveSession,
    refetch: fetchStats,
  };
}
