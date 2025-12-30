// Database types for NPTE Study App

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  order: number;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  subcategory_id: string;
  front_text: string;
  back_text: string;
  source_pdf_id: string | null;
  source_page_number: number | null;
  tags: string[];
  created_at: string;
}

export interface UserFlashcardProgress {
  id: string;
  user_id: string;
  flashcard_id: string;
  ease_factor: number;      // SM-2 ease factor (default 2.5)
  interval: number;         // days until next review
  repetitions: number;      // number of successful reviews
  next_review_date: string;
  last_reviewed_at: string;
}

export interface Question {
  id: string;
  subcategory_id: string;
  question_text: string;
  options: QuestionOption[];
  explanation: string;
  source_pdf_id: string | null;
  source_page_number: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface QuestionOption {
  text: string;
  is_correct: boolean;
}

export interface UserQuestionHistory {
  id: string;
  user_id: string;
  question_id: string;
  selected_answer: number;
  is_correct: boolean;
  answered_at: string;
}

export interface PDF {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  uploaded_at: string;
}

// Spaced Repetition Types
export type ConfidenceRating = 'again' | 'hard' | 'good' | 'easy';

export interface SpacedRepetitionResult {
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: Date;
}

// UI Types
export interface FlashcardWithProgress extends Flashcard {
  progress?: UserFlashcardProgress;
  subcategory?: Subcategory;
  category?: Category;
}

export interface CategoryWithStats extends Category {
  total_cards: number;
  cards_learned: number;
  cards_due: number;
  subcategories?: Subcategory[];
}

export interface StudySession {
  category_id: string;
  cards_studied: number;
  cards_correct: number;
  started_at: Date;
  ended_at?: Date;
}
