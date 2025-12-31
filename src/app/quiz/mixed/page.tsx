'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { questions as allQuestions, categories, subcategories } from '@/lib/seed-data';
import { Question } from '@/types';
import { useQuizProgress } from '@/hooks/useQuizProgress';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_KEY = 'npte-quiz-session-mixed';

interface QuizSession {
  currentIndex: number;
  score: { correct: number; total: number };
  answeredQuestions: { [questionId: string]: number };
  shuffledIds: string[];
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MixedQuizPage() {
  const { user } = useAuth();
  const { saveAnswer, loading } = useQuizProgress();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<{ [key: string]: number }>({});
  const [initialized, setInitialized] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [hasStarted, setHasStarted] = useState(false);

  // Get category for a question
  const getCategoryForQuestion = useCallback((question: Question) => {
    const subcategory = subcategories.find(s => s.id === question.subcategory_id);
    if (!subcategory) return null;
    return categories.find(c => c.id === subcategory.category_id);
  }, []);

  // Restore session on mount
  useEffect(() => {
    if (!loading) {
      try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          const session: QuizSession = JSON.parse(stored);
          setCurrentIndex(session.currentIndex);
          setScore(session.score);
          setAnsweredQuestions(session.answeredQuestions);
          // Restore the shuffled order
          const questionMap = new Map(allQuestions.map(q => [q.id, q]));
          const restored = session.shuffledIds
            .map(id => questionMap.get(id))
            .filter((q): q is Question => q !== undefined);
          if (restored.length > 0) {
            setShuffledQuestions(restored);
            setHasStarted(true);
          }
        }
      } catch (error) {
        console.error('Error restoring quiz session:', error);
      }
      setInitialized(true);
    }
  }, [loading]);

  // Check if current question was already answered (for session restore)
  useEffect(() => {
    const currentQuestion = shuffledQuestions[currentIndex];
    if (currentQuestion && initialized) {
      const previousAnswer = answeredQuestions[currentQuestion.id];
      if (previousAnswer !== undefined) {
        setSelectedAnswer(previousAnswer);
        setShowExplanation(true);
      } else {
        setSelectedAnswer(null);
        setShowExplanation(false);
      }
    }
  }, [currentIndex, shuffledQuestions, answeredQuestions, initialized]);

  // Save session state
  const saveSession = useCallback((
    index: number,
    newScore: { correct: number; total: number },
    newAnswered: { [key: string]: number },
    questions: Question[]
  ) => {
    try {
      const session: QuizSession = {
        currentIndex: index,
        score: newScore,
        answeredQuestions: newAnswered,
        shuffledIds: questions.map(q => q.id),
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving quiz session:', error);
    }
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Error clearing quiz session:', error);
    }
  }, []);

  const handleStartQuiz = () => {
    const shuffled = shuffleArray(allQuestions as Question[]).slice(0, questionCount);
    setShuffledQuestions(shuffled);
    setHasStarted(true);
    saveSession(0, { correct: 0, total: 0 }, {}, shuffled);
  };

  const currentQuestion = shuffledQuestions[currentIndex];

  const handleSelectAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);

    const isCorrect = currentQuestion.options[index].is_correct;
    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      total: score.total + 1,
    };
    setScore(newScore);

    const newAnswered = { ...answeredQuestions, [currentQuestion.id]: index };
    setAnsweredQuestions(newAnswered);

    // Save answer to database/localStorage
    saveAnswer(currentQuestion.id, index, isCorrect);

    // Save session state
    saveSession(currentIndex, newScore, newAnswered, shuffledQuestions);
  };

  const handleNext = () => {
    if (currentIndex < shuffledQuestions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      saveSession(nextIndex, score, answeredQuestions, shuffledQuestions);
    } else {
      setIsComplete(true);
      clearSession();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore({ correct: 0, total: 0 });
    setAnsweredQuestions({});
    setIsComplete(false);
    setHasStarted(false);
    setShuffledQuestions([]);
    clearSession();
  };

  if (loading || !initialized) {
    return (
      <div>
        <Header
          title="Mixed Quiz"
          subtitle="Loading..."
        />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  // Setup screen
  if (!hasStarted) {
    return (
      <div>
        <Header
          title="Mixed Quiz"
          subtitle="Random questions from all categories"
          action={
            <Link href="/quiz" className="btn-secondary">
              Back to Categories
            </Link>
          }
        />
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="card p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-500 mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Mixed Quiz Session</h2>
              <p className="text-gray-400 mt-2">
                Questions will be randomly selected from all {allQuestions.length} questions across {categories.length} categories.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                How many questions do you want to answer?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50, 100].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      questionCount === count
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Or answer all {allQuestions.length} questions
              </p>
              <button
                onClick={() => setQuestionCount(allQuestions.length)}
                className={`mt-2 w-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  questionCount === allQuestions.length
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                All Questions ({allQuestions.length})
              </button>
            </div>

            <button
              onClick={handleStartQuiz}
              className="btn-primary w-full"
            >
              Start Quiz with {questionCount} Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score.correct / score.total) * 100);

    return (
      <div>
        <Header title="Mixed Quiz" subtitle="Quiz Complete!" />
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-8 text-6xl">
            {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚'}
          </div>
          <h2 className="text-2xl font-bold text-white">
            You scored {score.correct} out of {score.total}
          </h2>
          <p className="mt-2 text-xl text-pink-400">{percentage}%</p>
          {user && (
            <p className="mt-2 text-sm text-green-400">
              Progress saved to your account
            </p>
          )}
          {!user && (
            <p className="mt-2 text-sm text-amber-400">
              Progress saved locally. Sign in to sync across devices.
            </p>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
            <button
              onClick={handleRestart}
              className="btn-primary w-full sm:w-auto"
            >
              New Mixed Quiz
            </button>
            <Link
              href="/quiz"
              className="btn-secondary text-center w-full sm:w-auto"
            >
              Back to Categories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentCategory = getCategoryForQuestion(currentQuestion);

  return (
    <div>
      <Header
        title="Mixed Quiz"
        subtitle={`Question ${currentIndex + 1} of ${shuffledQuestions.length}${currentCategory ? ` • ${currentCategory.name}` : ''}`}
        action={
          <Link href="/quiz" className="btn-secondary">
            Exit Quiz
          </Link>
        }
      />

      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        {/* Progress bar */}
        <div className="mb-6 h-2 progress-bar">
          <div
            className="progress-bar-fill bg-gradient-to-r from-pink-500 to-purple-500"
            style={{ width: `${((currentIndex + 1) / shuffledQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="card p-6">
          {currentCategory && (
            <div className="mb-4 flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentCategory.color }}
              />
              <span className="text-sm text-gray-400">{currentCategory.name}</span>
            </div>
          )}

          <p className="mb-6 text-lg font-medium text-white">
            {currentQuestion.question_text}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              let buttonClass = 'border-pink-500/20 hover:border-pink-500/50 hover:bg-pink-500/10';

              if (selectedAnswer !== null) {
                if (option.is_correct) {
                  buttonClass = 'border-emerald-500 bg-emerald-500/20';
                } else if (index === selectedAnswer && !option.is_correct) {
                  buttonClass = 'border-red-500 bg-red-500/20';
                } else {
                  buttonClass = 'border-gray-700 opacity-50';
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full rounded-lg border-2 bg-[#12121a] p-4 text-left transition-all ${buttonClass}`}
                >
                  <span className="font-medium text-pink-400">
                    {String.fromCharCode(65 + index)}.{' '}
                  </span>
                  <span className="text-white">{option.text}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="mt-6 rounded-lg bg-pink-500/10 border border-pink-500/20 p-4">
              <h4 className="font-medium text-pink-400">Explanation</h4>
              <p className="mt-2 text-gray-300">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Next button */}
          {selectedAnswer !== null && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNext}
                className="btn-primary"
              >
                {currentIndex < shuffledQuestions.length - 1 ? 'Next Question' : 'See Results'}
              </button>
            </div>
          )}
        </div>

        {/* Score */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Score: {score.correct} / {score.total}
        </div>
      </div>
    </div>
  );
}
