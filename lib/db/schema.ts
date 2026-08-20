import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  userId: text('user_id').notNull(),
  createdAt: text('created_at').notNull(),
});

export const testCases = sqliteTable('test_cases', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  module: text('module').notNull(),         // e.g., 'Auth', 'Billing', 'Checkout'
  priority: text('priority').notNull(),     // 'P0', 'P1', 'P2', 'P3'
  title: text('title').notNull(),
  description: text('description'),
  expectedResult: text('expected_result').notNull(),
  createdAt: text('created_at').notNull(),
});

export const testRuns = sqliteTable('test_runs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  name: text('name'),
  status: text('status').notNull(),         // 'PASSED', 'FAILED', 'IN_PROGRESS'
  executedAt: text('executed_at').notNull(),
  completedAt: text('completed_at'),
});

// Granular results for each test case in a given run
export const testResults = sqliteTable('test_results', {
  id: text('id').primaryKey(),
  testRunId: text('test_run_id').notNull(),
  testCaseId: text('test_case_id').notNull(),
  status: text('status').notNull(),         // 'PASSED', 'FAILED', 'SKIPPED', 'PENDING'
  actualResult: text('actual_result'),
  notes: text('notes'),
  executedAt: text('executed_at'),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type TestCase = typeof testCases.$inferSelect;
export type NewTestCase = typeof testCases.$inferInsert;

export type TestRun = typeof testRuns.$inferSelect;
export type NewTestRun = typeof testRuns.$inferInsert;

export type TestResult = typeof testResults.$inferSelect;
export type NewTestResult = typeof testResults.$inferInsert;
