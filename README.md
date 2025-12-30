# NPTE Study Guide

A modern flashcard and quiz application for NPTE (National Physical Therapy Examination) exam preparation, built with Next.js and Supabase.

## Features

- **Spaced Repetition System** - SM-2 algorithm optimizes review intervals for better retention
- **3,800+ Flashcards** - Comprehensive coverage of all NPTE exam topics
- **500+ Practice Questions** - Multiple-choice questions with detailed explanations
- **12 Exam Categories** - Musculoskeletal, Neuromuscular, Cardiovascular, Pulmonary, and more
- **Progress Tracking** - Detailed analytics on your performance by category
- **Cloud Sync** - Sign in with Google to sync progress across devices
- **Responsive Design** - Works great on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Authentication**: Google OAuth via Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/brendanbuchanan21/NPTE-Study-Guide.git
   cd NPTE-Study-Guide
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. Set up the database:
   - Go to your Supabase project's SQL Editor
   - Run the SQL in `supabase/schema.sql` to create tables and policies

5. Configure Google OAuth in Supabase:
   - Go to Authentication > Providers > Google
   - Add your Google OAuth credentials
   - Add your site URL to the redirect URLs

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard
│   ├── study/             # Flashcard study mode
│   ├── quiz/              # Quiz mode
│   ├── progress/          # Progress analytics
│   └── browse/            # Browse all content
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── flashcard/         # Flashcard components
│   ├── landing/           # Landing page
│   ├── layout/            # Layout components (Sidebar, Header)
│   └── progress/          # Progress tracking components
├── contexts/              # React contexts (Auth)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and data
│   ├── seed-data.ts       # Flashcard and question content
│   ├── spaced-repetition.ts # SM-2 algorithm
│   └── supabase.ts        # Supabase client
└── types/                 # TypeScript types
```

## Database Schema

The app uses the following main tables:

- `categories` - NPTE exam categories
- `subcategories` - Detailed subcategories
- `flashcards` - Flashcard content (front/back)
- `questions` - Multiple-choice questions
- `user_flashcard_progress` - Spaced repetition progress
- `user_question_history` - Quiz history
- `study_sessions` - Daily study tracking

See `supabase/schema.sql` for the complete schema with RLS policies.

## License

MIT
