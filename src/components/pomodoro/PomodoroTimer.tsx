'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type TimerMode = 'work' | 'break';
type TimerState = 'idle' | 'running' | 'paused';

interface PomodoroSettings {
  workDuration: number; // in minutes
  breakDuration: number;
  soundEnabled: boolean;
}

interface TimerData {
  mode: TimerMode;
  state: TimerState;
  timeRemaining: number; // in seconds
  settings: PomodoroSettings;
  completedPomodoros: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  breakDuration: 5,
  soundEnabled: true,
};

const STORAGE_KEY = 'npte-pomodoro-timer';

// Play a notification sound using Web Audio API
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Create a pleasant chime sound
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    // Play a pleasant three-tone chime
    playTone(523.25, now, 0.2); // C5
    playTone(659.25, now + 0.15, 0.2); // E5
    playTone(783.99, now + 0.3, 0.3); // G5
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
}

export default function PomodoroTimer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [state, setState] = useState<TimerState>('idle');
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_SETTINGS.workDuration * 60);
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: TimerData = JSON.parse(stored);
        setMode(data.mode);
        setState(data.state === 'running' ? 'paused' : data.state); // Pause if was running
        setTimeRemaining(data.timeRemaining);
        setSettings(data.settings);
        setCompletedPomodoros(data.completedPomodoros);
      }
    } catch (error) {
      console.error('Error loading pomodoro state:', error);
    }
    setInitialized(true);
  }, []);

  // Save state to localStorage
  const saveState = useCallback(() => {
    const data: TimerData = {
      mode,
      state,
      timeRemaining,
      settings,
      completedPomodoros,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving pomodoro state:', error);
    }
  }, [mode, state, timeRemaining, settings, completedPomodoros]);

  // Save state whenever it changes
  useEffect(() => {
    if (initialized) {
      saveState();
    }
  }, [initialized, saveState]);

  // Timer logic
  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Timer complete
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state]);

  const handleTimerComplete = useCallback(() => {
    setState('idle');

    // Play sound if enabled
    if (settings.soundEnabled) {
      playNotificationSound();
    }

    if (mode === 'work') {
      setCompletedPomodoros(prev => prev + 1);
      setMode('break');
      setTimeRemaining(settings.breakDuration * 60);
    } else {
      setMode('work');
      setTimeRemaining(settings.workDuration * 60);
    }
  }, [mode, settings]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setState('running');
  };

  const handlePause = () => {
    setState('paused');
  };

  const handleReset = () => {
    setState('idle');
    setTimeRemaining(mode === 'work' ? settings.workDuration * 60 : settings.breakDuration * 60);
  };

  const handleSkip = () => {
    setState('idle');
    if (mode === 'work') {
      setMode('break');
      setTimeRemaining(settings.breakDuration * 60);
    } else {
      setMode('work');
      setTimeRemaining(settings.workDuration * 60);
    }
  };

  const updateSettings = (newSettings: Partial<PomodoroSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Update time if idle
      if (state === 'idle') {
        if (mode === 'work' && newSettings.workDuration) {
          setTimeRemaining(newSettings.workDuration * 60);
        } else if (mode === 'break' && newSettings.breakDuration) {
          setTimeRemaining(newSettings.breakDuration * 60);
        }
      }
      return updated;
    });
  };

  const progress = mode === 'work'
    ? ((settings.workDuration * 60 - timeRemaining) / (settings.workDuration * 60)) * 100
    : ((settings.breakDuration * 60 - timeRemaining) / (settings.breakDuration * 60)) * 100;

  if (!initialized) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
        {isExpanded ? (
          <div className="bg-[#12121a] border border-pink-500/20 rounded-xl shadow-lg overflow-hidden w-72">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-pink-500/20">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${mode === 'work' ? 'bg-pink-500' : 'bg-green-500'}`} />
                <span className="text-sm font-medium text-white">
                  {mode === 'work' ? 'Focus Time' : 'Break Time'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  title="Settings"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  title="Minimize"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Settings panel */}
            {showSettings && (
              <div className="px-4 py-3 border-b border-pink-500/20 bg-[#0a0a0f]">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400">Focus Duration (min)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.workDuration}
                      onChange={(e) => updateSettings({ workDuration: parseInt(e.target.value) || 25 })}
                      className="w-full mt-1 px-3 py-1.5 bg-[#12121a] border border-pink-500/20 rounded text-white text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Break Duration (min)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.breakDuration}
                      onChange={(e) => updateSettings({ breakDuration: parseInt(e.target.value) || 5 })}
                      className="w-full mt-1 px-3 py-1.5 bg-[#12121a] border border-pink-500/20 rounded text-white text-sm focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">Sound notification</label>
                    <button
                      onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        settings.soundEnabled ? 'bg-pink-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.soundEnabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Timer display */}
            <div className="px-4 py-6 text-center">
              <div className="text-5xl font-mono font-bold text-white mb-4">
                {formatTime(timeRemaining)}
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full transition-all ${mode === 'work' ? 'bg-pink-500' : 'bg-green-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2">
                {state === 'running' ? (
                  <button
                    onClick={handlePause}
                    className="p-3 bg-pink-500/20 text-pink-400 rounded-full hover:bg-pink-500/30 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    className="p-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="p-3 text-gray-400 hover:text-white transition-colors"
                  title="Reset"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={handleSkip}
                  className="p-3 text-gray-400 hover:text-white transition-colors"
                  title="Skip to next"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-pink-500/20 bg-[#0a0a0f]">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Completed today</span>
                <span className="text-pink-400 font-medium">{completedPomodoros} pomodoros</span>
              </div>
            </div>
          </div>
        ) : (
          /* Minimized view */
          <button
            onClick={() => setIsExpanded(true)}
            className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-lg transition-all hover:scale-105 ${
              state === 'running'
                ? mode === 'work'
                  ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                  : 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'bg-[#12121a] border-pink-500/20 text-gray-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              state === 'running' ? 'animate-pulse' : ''
            } ${mode === 'work' ? 'bg-pink-500' : 'bg-green-500'}`} />
            <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
            {state === 'running' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            )}
          </button>
        )}
    </div>
  );
}
