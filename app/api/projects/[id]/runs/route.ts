import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { testRuns, testResults, testCases } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id } = await params;
    const numericProjectId = Number(id);

    const runs = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.projectId, numericProjectId))
      .orderBy(desc(testRuns.executedAt));

    const runsWithStats = await Promise.all(
      runs.map(async (run) => {
        const results = await db
          .select()
          .from(testResults)
          .where(eq(testResults.testRunId, run.id));

        return {
          ...run,
          total: results.length,
          passed: results.filter((r) => r.status === 'PASSED').length,
          failed: results.filter((r) => r.status === 'FAILED').length,
          skipped: results.filter((r) => r.status === 'SKIPPED').length,
          pending: results.filter((r) => r.status === 'PENDING').length,
        };
      })
    );

    return NextResponse.json({ testRuns: runsWithStats });
  } catch (error) {
    console.error('Failed to fetch test runs:', error);
    return NextResponse.json({ error: 'Failed to fetch test runs' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id } = await params;
    const numericProjectId = Number(id);
    const body = await request.json();
    const { name, testCaseIds } = body;

    // Fetch all test cases if specific ones were not passed
    let targetCaseIds: number[] = (testCaseIds || []).map((cid: string | number) => Number(cid));
    if (targetCaseIds.length === 0) {
      const allCases = await db
        .select({ id: testCases.id })
        .from(testCases)
        .where(eq(testCases.projectId, numericProjectId));
      targetCaseIds = allCases.map((c) => c.id);
    }

    if (targetCaseIds.length === 0) {
      return NextResponse.json(
        { error: 'Cannot create a test run with 0 test cases' },
        { status: 400 }
      );
    }

    const insertedRuns = await db
      .insert(testRuns)
      .values({
        projectId: numericProjectId,
        name: name || `Regression Run #${new Date().toLocaleDateString()}`,
        status: 'IN_PROGRESS',
        executedAt: new Date().toISOString(),
        completedAt: null,
      })
      .returning();

    const newRun = insertedRuns[0];

    // Create pending test results for each test case
    for (const caseId of targetCaseIds) {
      await db.insert(testResults).values({
        testRunId: newRun.id,
        testCaseId: caseId,
        status: 'PENDING',
        actualResult: null,
        notes: null,
        executedAt: null,
      });
    }

    return NextResponse.json({ testRun: newRun, runId: newRun.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to create test run:', error);
    return NextResponse.json({ error: 'Failed to create test run' }, { status: 500 });
  }
}
