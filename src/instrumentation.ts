export async function register() {
  // Only run on server startup in Node.js runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./lib/migrations');

    try {
      console.log('Running database migrations...');
      const result = await runMigrations();

      if (result?.needsSetup) {
        console.log('Database setup required - call POST /api/setup-db');
      } else {
        console.log('Database migrations complete');
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  }
}
