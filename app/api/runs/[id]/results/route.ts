import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { testResults, testRuns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id: testRunId } = await params;
    const body = await request.json();
    const { resultId, testCaseId, status, actualResult, notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      status,
      executedAt: new Date().toISOString(),
    };
    if (actualResult !== undefined) updatePayload.actualResult = actualResult;
    if (notes !== undefined) updatePayload.notes = notes;

    if (resultId) {
      await db.update(testResults).set(updatePayload).where(eq(testResults.id, resultId));
    } else if (testCaseId) {
      await db
        .update(testResults)
        .set(updatePayload)
        .where(eq(testResults.testCaseId, testCaseId));
    } else {
      return NextResponse.json({ error: 'resultId or testCaseId required' }, { status: 400 });
    }

    // Check all test results for this run to see if all tests are finished
    const allResults = await db
      .select()
      .from(testResults)
      .where(eq(testResults.testRunId, testRunId));

    const total = allResults.length;
    const pendingCount = allResults.filter((r) => r.status === 'PENDING').length;
    const failedCount = allResults.filter((r) => r.status === 'FAILED').length;

    let runStatus = 'IN_PROGRESS';
    let completedAt: string | null = null;

    if (pendingCount === 0 && total > 0) {
      runStatus = failedCount > 0 ? 'FAILED' : 'PASSED';
      completedAt = new Date().toISOString();
      await db
        .update(testRuns)
        .set({ status: runStatus, completedAt })
        .where(eq(testRuns.id, testRunId));
    }

    return NextResponse.json({
      success: true,
      runStatus,
      completed: pendingCount === 0,
      stats: {
        total,
        passed: allResults.filter((r) => r.status === 'PASSED').length,
        failed: failedCount,
        skipped: allResults.filter((r) => r.status === 'SKIPPED').length,
        pending: pendingCount,
      },
    });
  } catch (error) {
    console.error('Failed to update test result:', error);
    return NextResponse.json({ error: 'Failed to update test result' }, { status: 500 });
  }
}
