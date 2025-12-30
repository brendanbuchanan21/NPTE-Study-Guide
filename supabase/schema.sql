-- NPTE Study App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories (NPTE exam sections)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategories
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded PDFs
CREATE TABLE pdfs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  source_pdf_id UUID REFERENCES pdfs(id) ON DELETE SET NULL,
  source_page_number INTEGER,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User flashcard progress (spaced repetition)
CREATE TABLE user_flashcard_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  ease_factor DECIMAL(4,2) DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_date TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, flashcard_id)
);

-- Practice questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {text, is_correct}
  explanation TEXT,
  source_pdf_id UUID REFERENCES pdfs(id) ON DELETE SET NULL,
  source_page_number INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User question history
CREATE TABLE user_question_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- User study streaks
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_flashcards_subcategory ON flashcards(subcategory_id);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_user_progress_user ON user_flashcard_progress(user_id);
CREATE INDEX idx_user_progress_next_review ON user_flashcard_progress(next_review_date);
CREATE INDEX idx_questions_subcategory ON questions(subcategory_id);
CREATE INDEX idx_question_history_user ON user_question_history(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;

-- Categories and subcategories are public read
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Subcategories are viewable by everyone" ON subcategories FOR SELECT USING (true);

-- Flashcards and questions are public read
CREATE POLICY "Flashcards are viewable by everyone" ON flashcards FOR SELECT USING (true);
CREATE POLICY "Questions are viewable by everyone" ON questions FOR SELECT USING (true);

-- User progress is private to each user
CREATE POLICY "Users can view own progress" ON user_flashcard_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_flashcard_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_flashcard_progress FOR UPDATE USING (auth.uid() = user_id);

-- Question history is private
CREATE POLICY "Users can view own question history" ON user_question_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own question history" ON user_question_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Streaks are private
CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- PDFs are private to uploader
CREATE POLICY "Users can view own PDFs" ON pdfs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own PDFs" ON pdfs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Study sessions table for tracking daily progress
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  cards_studied INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  session_date DATE DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, session_date)
);

-- Index for study sessions
CREATE INDEX idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_date ON study_sessions(session_date);

-- RLS for study sessions
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study sessions" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Pomodoro sessions table for tracking focus time
CREATE TABLE pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  session_date DATE DEFAULT CURRENT_DATE
);

-- Indexes for pomodoro sessions
CREATE INDEX idx_pomodoro_sessions_user ON pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_sessions_date ON pomodoro_sessions(session_date);
CREATE INDEX idx_pomodoro_sessions_completed ON pomodoro_sessions(completed_at);

-- RLS for pomodoro sessions
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pomodoro sessions" ON pomodoro_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pomodoro sessions" ON pomodoro_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
