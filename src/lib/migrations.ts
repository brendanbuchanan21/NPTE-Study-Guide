import { createClient } from '@supabase/supabase-js';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Migration definitions
const migrations = [
  {
    id: '001_fix_fk_constraints',
    name: 'Remove foreign key constraints for local seed data',
    up: async (supabase: any) => {
      // We'll use a database function to execute raw SQL
      // First, create the function if it doesn't exist, then call it

      const { error } = await supabase.rpc('run_migration_001');

      if (error && error.message.includes('does not exist')) {
        // Function doesn't exist yet - that's OK for first run
        // The function will be created by the setup migration
        console.log('Migration function not found - will be created');
        return { needsSetup: true };
      }

      if (error) {
        throw error;
      }

      return { success: true };
    },
  },
];

// Check if migrations table exists and create if needed
async function ensureMigrationsTable(supabase: any) {
  // Try to select from migrations table
  const { error } = await supabase
    .from('_migrations')
    .select('id')
    .limit(1);

  if (error && error.code === '42P01') {
    // Table doesn't exist - we need to create it via the setup endpoint
    return false;
  }

  return true;
}

// Get list of completed migrations
async function getCompletedMigrations(supabase: any): Promise<string[]> {
  const { data, error } = await supabase
    .from('_migrations')
    .select('migration_id');

  if (error) {
    console.error('Error fetching migrations:', error);
    return [];
  }

  return data?.map((m: any) => m.migration_id) || [];
}

// Mark migration as completed
async function markMigrationComplete(supabase: any, migrationId: string) {
  const { error } = await supabase
    .from('_migrations')
    .insert({ migration_id: migrationId, applied_at: new Date().toISOString() });

  if (error) {
    console.error('Error marking migration complete:', error);
  }
}

// Run all pending migrations
export async function runMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('Migrations: Missing Supabase credentials, skipping');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  // Check if setup is needed
  const tableExists = await ensureMigrationsTable(supabase);

  if (!tableExists) {
    console.log('Migrations: Setup required - calling setup endpoint');
    // We need to trigger setup via API call since we can't run raw SQL
    return { needsSetup: true };
  }

  const completed = await getCompletedMigrations(supabase);

  for (const migration of migrations) {
    if (completed.includes(migration.id)) {
      continue;
    }

    console.log(`Migrations: Running ${migration.id} - ${migration.name}`);

    try {
      const result = await migration.up(supabase);

      if (result && 'needsSetup' in result) {
        return { needsSetup: true };
      }

      await markMigrationComplete(supabase, migration.id);
      console.log(`Migrations: Completed ${migration.id}`);
    } catch (error) {
      console.error(`Migrations: Failed ${migration.id}:`, error);
      throw error;
    }
  }

  return { success: true };
}
