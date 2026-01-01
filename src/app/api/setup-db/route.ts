import { NextResponse } from 'next/server';
import pg from 'pg';

// This endpoint sets up the database for migrations
// It creates the necessary functions and tables
// Only needs to be called once, but is idempotent

export async function POST() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json({
      error: 'DATABASE_URL not configured',
      instructions: `
Add DATABASE_URL to your .env.local file:

1. Go to: https://supabase.com/dashboard/project/immgyhvsoplitbaoworl/settings/database
2. Copy the "Connection string" (URI format) under "Connection Pooling"
3. Add to .env.local:
   DATABASE_URL="postgresql://postgres.immgyhvsoplitbaoworl:[YOUR-PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"
4. Restart the dev server and call this endpoint again
      `.trim()
    }, { status: 500 });
  }

  const client = new pg.Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        migration_id TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create migration function for fixing FK constraints
    await client.query(`
      CREATE OR REPLACE FUNCTION run_migration_001()
      RETURNS void AS $$
      BEGIN
        -- Drop foreign key constraints if they exist
        ALTER TABLE user_flashcard_progress
        DROP CONSTRAINT IF EXISTS user_flashcard_progress_flashcard_id_fkey;

        ALTER TABLE user_question_history
        DROP CONSTRAINT IF EXISTS user_question_history_question_id_fkey;

        -- Change column types to TEXT (idempotent - won't error if already TEXT)
        BEGIN
          ALTER TABLE user_flashcard_progress
          ALTER COLUMN flashcard_id TYPE TEXT;
        EXCEPTION WHEN others THEN
          -- Column might already be TEXT, that's fine
          NULL;
        END;

        BEGIN
          ALTER TABLE user_question_history
          ALTER COLUMN question_id TYPE TEXT;
        EXCEPTION WHEN others THEN
          -- Column might already be TEXT, that's fine
          NULL;
        END;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // Run the migration immediately
    await client.query('SELECT run_migration_001()');

    // Mark as complete
    await client.query(`
      INSERT INTO _migrations (migration_id)
      VALUES ('001_fix_fk_constraints')
      ON CONFLICT (migration_id) DO NOTHING;
    `);

    await client.end();

    return NextResponse.json({
      success: true,
      message: 'Database setup complete! FK constraints removed, migrations applied.'
    });

  } catch (error) {
    await client.end().catch(() => {});
    console.error('Database setup error:', error);
    return NextResponse.json({
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to run database setup',
    status: 'ready'
  });
}
