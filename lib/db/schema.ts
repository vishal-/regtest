import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  userId: text('user_id').notNull(), // Creator / Owner user ID
  createdAt: text('created_at').notNull(),
});

export const projectMembers = sqliteTable('project_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email'),
  role: text('role').notNull().default('MEMBER'), // 'OWNER' | 'MEMBER' | 'ADMIN'
  addedAt: text('added_at').notNull(),
});

export const testCases = sqliteTable('test_cases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull(),
  module: text('module').notNull(),         // e.g., 'Auth', 'Billing', 'Checkout'
  priority: text('priority').notNull(),     // 'P0', 'P1', 'P2', 'P3'
  title: text('title').notNull(),
  description: text('description'),
  expectedResult: text('expected_result').notNull(),
  createdAt: text('created_at').notNull(),
});

export const testRuns = sqliteTable('test_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull(),
  name: text('name'),
  status: text('status').notNull(),         // 'PASSED', 'FAILED', 'IN_PROGRESS'
  executedAt: text('executed_at').notNull(),
  completedAt: text('completed_at'),
});

// Granular results for each test case in a given run
export const testResults = sqliteTable('test_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  testRunId: integer('test_run_id').notNull(),
  testCaseId: integer('test_case_id').notNull(),
  status: text('status').notNull(),         // 'PASSED', 'FAILED', 'SKIPPED', 'PENDING'
  actualResult: text('actual_result'),
  notes: text('notes'),
  executedAt: text('executed_at'),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;

export type TestCase = typeof testCases.$inferSelect;
export type NewTestCase = typeof testCases.$inferInsert;

export type TestRun = typeof testRuns.$inferSelect;
export type NewTestRun = typeof testRuns.$inferInsert;

export type TestResult = typeof testResults.$inferSelect;
export type NewTestResult = typeof testResults.$inferInsert;
