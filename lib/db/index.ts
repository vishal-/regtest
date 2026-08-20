import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = process.env.TURSO_DATABASE_URL || 'file:sqlite.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

// Helper to auto-create tables if they don't exist yet (especially in local dev mode)
let tablesInitialized = false;

export async function ensureTablesExist() {
  if (tablesInitialized) return;
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        module TEXT NOT NULL,
        priority TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        expected_result TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_runs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT,
        status TEXT NOT NULL,
        executed_at TEXT NOT NULL,
        completed_at TEXT
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_results (
        id TEXT PRIMARY KEY,
        test_run_id TEXT NOT NULL,
        test_case_id TEXT NOT NULL,
        status TEXT NOT NULL,
        actual_result TEXT,
        notes TEXT,
        executed_at TEXT
      );
    `);

    tablesInitialized = true;
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
}
