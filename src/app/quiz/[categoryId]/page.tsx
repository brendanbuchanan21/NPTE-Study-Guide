'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { categories, questions as allQuestions, subcategories } from '@/lib/seed-data';
import { Question } from '@/types';

interface QuizCategoryPageProps {
  params: Promise<{ categoryId: string }>;
}

export default function QuizCategoryPage({ params }: QuizCategoryPageProps) {
  const { categoryId } = use(params);
  const category = categories.find(c => c.id === categoryId);

  // Get questions for this category
  const categorySubs = subcategories.filter(s => s.category_id === categoryId);
  const questions = allQuestions.filter(q =>
    categorySubs.some(s => s.id === q.subcategory_id)
  ) as Question[];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleSelectAnswer = (index: number) => {
    if (selectedAnswer !== null) return; // Already answered
    setSelectedAnswer(index);
    setShowExplanation(true);

    const isCorrect = currentQuestion.options[index].is_correct;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore({ correct: 0, total: 0 });
    setIsComplete(false);
  };

  if (!category) {
    return (
      <div className="p-6">
        <p className="text-gray-400">Category not found</p>
        <Link href="/quiz" className="text-pink-400 hover:underline">
          Back to quiz categories
        </Link>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div>
        <Header
          title={category.name}
          subtitle="Practice Quiz"
          action={
            <Link
              href="/quiz"
              className="btn-secondary"
            >
              Back to Categories
            </Link>
          }
        />
        <div className="flex flex-col items-center justify-center py-24">
          <div
            className="mb-4 h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${category.color}30`, border: `2px solid ${category.color}` }}
          >
            <div
              className="h-8 w-8 rounded-lg"
              style={{ backgroundColor: category.color }}
            />
          </div>
          <h2 className="text-xl font-semibold text-white">No questions yet</h2>
          <p className="mt-2 text-gray-500">
            Practice questions will be added once content is uploaded.
          </p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score.correct / score.total) * 100);

    return (
      <div>
        <Header title={category.name} subtitle="Quiz Complete!" />
        <div className="flex flex-col items-center justify-center py-24">
          <div className="mb-8 text-6xl">
            {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚'}
          </div>
          <h2 className="text-2xl font-bold text-white">
            You scored {score.correct} out of {score.total}
          </h2>
          <p className="mt-2 text-xl text-pink-400">{percentage}%</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
            <button
              onClick={handleRestart}
              className="btn-primary w-full sm:w-auto"
            >
              Try Again
            </button>
            <Link
              href="/quiz"
              className="btn-secondary text-center w-full sm:w-auto"
            >
              Choose Another Category
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={category.name}
        subtitle={`Question ${currentIndex + 1} of ${questions.length}`}
        action={
          <Link
            href="/quiz"
            className="btn-secondary"
          >
            Exit Quiz
          </Link>
        }
      />

      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        {/* Progress bar */}
        <div className="mb-6 h-2 progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="card p-6">
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
                {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
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
