import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { testRuns, testResults, testCases, projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id } = await params;

    const runList = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.id, id))
      .limit(1);

    if (!runList || runList.length === 0) {
      return NextResponse.json({ error: 'Test run not found' }, { status: 404 });
    }

    const run = runList[0];

    const projectList = await db
      .select()
      .from(projects)
      .where(eq(projects.id, run.projectId))
      .limit(1);

    const results = await db
      .select({
        id: testResults.id,
        testRunId: testResults.testRunId,
        testCaseId: testResults.testCaseId,
        status: testResults.status,
        actualResult: testResults.actualResult,
        notes: testResults.notes,
        executedAt: testResults.executedAt,
        testCase: {
          id: testCases.id,
          title: testCases.title,
          module: testCases.module,
          priority: testCases.priority,
          description: testCases.description,
          expectedResult: testCases.expectedResult,
        },
      })
      .from(testResults)
      .innerJoin(testCases, eq(testResults.testCaseId, testCases.id))
      .where(eq(testResults.testRunId, id));

    const total = results.length;
    const passed = results.filter((r) => r.status === 'PASSED').length;
    const failed = results.filter((r) => r.status === 'FAILED').length;
    const skipped = results.filter((r) => r.status === 'SKIPPED').length;
    const pending = results.filter((r) => r.status === 'PENDING').length;

    return NextResponse.json({
      run,
      project: projectList[0] || null,
      results,
      stats: {
        total,
        passed,
        failed,
        skipped,
        pending,
        progressPercent: total > 0 ? Math.round(((total - pending) / total) * 100) : 0,
        passRate: total - pending > 0 ? Math.round((passed / (total - pending)) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch test run details:', error);
    return NextResponse.json({ error: 'Failed to fetch test run details' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id } = await params;
    const body = await request.json();
    const { status, name, completedAt } = body;

    await db
      .update(testRuns)
      .set({
        ...(status ? { status } : {}),
        ...(name ? { name } : {}),
        ...(completedAt !== undefined ? { completedAt } : {}),
      })
      .where(eq(testRuns.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update test run:', error);
    return NextResponse.json({ error: 'Failed to update test run' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id } = await params;

    await db.delete(testResults).where(eq(testResults.testRunId, id));
    await db.delete(testRuns).where(eq(testRuns.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete test run:', error);
    return NextResponse.json({ error: 'Failed to delete test run' }, { status: 500 });
  }
}
