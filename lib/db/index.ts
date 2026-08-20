import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error('Please provide both TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
}

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });

// Helper to auto-create tables and migrate missing columns
let tablesInitialized = false;

export async function ensureTablesExist() {
  if (tablesInitialized) return;
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL DEFAULT 'PRJ',
        name TEXT NOT NULL,
        description TEXT,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS project_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        user_email TEXT,
        role TEXT NOT NULL DEFAULT 'MEMBER',
        added_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        case_number INTEGER NOT NULL DEFAULT 1,
        code TEXT NOT NULL DEFAULT 'TC-1',
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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT,
        status TEXT NOT NULL,
        executed_at TEXT NOT NULL,
        completed_at TEXT
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_run_id INTEGER NOT NULL,
        test_case_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        actual_result TEXT,
        notes TEXT,
        executed_at TEXT
      );
    `);

    // Safe column migrations in case tables existed previously
    try {
      await client.execute(`ALTER TABLE projects ADD COLUMN key TEXT NOT NULL DEFAULT 'PRJ';`);
    } catch (_) {}

    try {
      await client.execute(`ALTER TABLE test_cases ADD COLUMN case_number INTEGER NOT NULL DEFAULT 1;`);
    } catch (_) {}

    try {
      await client.execute(`ALTER TABLE test_cases ADD COLUMN code TEXT NOT NULL DEFAULT 'TC-1';`);
    } catch (_) {}

    tablesInitialized = true;
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
}
