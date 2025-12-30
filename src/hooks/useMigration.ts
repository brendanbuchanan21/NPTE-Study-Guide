'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const LOCAL_STORAGE_KEY = 'npte-flashcard-progress';
const MIGRATION_FLAG_KEY = 'npte-migration-prompted';

interface LocalProgress {
  flashcard_id: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string;
}

export function useMigration() {
  const { user } = useAuth();
  const [hasLocalData, setHasLocalData] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    count?: number;
    message?: string;
  } | null>(null);

  // Check for local data on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const hasData = stored && Object.keys(JSON.parse(stored)).length > 0;
    setHasLocalData(!!hasData);

    // Show prompt if user is authenticated, has local data, and hasn't been prompted
    const wasPrompted = localStorage.getItem(MIGRATION_FLAG_KEY);
    if (user && hasData && !wasPrompted) {
      setShowPrompt(true);
    }
  }, [user]);

  const migrate = useCallback(async () => {
    if (!user) return;

    setMigrating(true);
    setMigrationResult(null);

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) {
        setMigrationResult({ success: false, message: 'No local data found' });
        return;
      }

      const parsed = JSON.parse(stored);
      const progressData: LocalProgress[] = Object.entries(parsed).map(([id, data]: [string, unknown]) => {
        const typedData = data as LocalProgress;
        return {
          flashcard_id: id,
          ease_factor: typedData.ease_factor,
          interval: typedData.interval,
          repetitions: typedData.repetitions,
          next_review_date: typedData.next_review_date,
          last_reviewed_at: typedData.last_reviewed_at,
        };
      });

      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressData }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.skipped) {
          setMigrationResult({
            success: true,
            message: 'Your cloud data already exists. Local data was not migrated.',
          });
        } else {
          setMigrationResult({
            success: true,
            count: result.migrated,
            message: `Successfully migrated ${result.migrated} cards!`,
          });
          // Clear local storage after successful migration
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setHasLocalData(false);
        }
      } else {
        setMigrationResult({
          success: false,
          message: result.error || 'Migration failed',
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationResult({
        success: false,
        message: 'An error occurred during migration',
      });
    } finally {
      setMigrating(false);
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      setShowPrompt(false);
    }
  }, [user]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    setShowPrompt(false);
  }, []);

  return {
    hasLocalData,
    showPrompt,
    migrating,
    migrationResult,
    migrate,
    dismissPrompt,
  };
}
