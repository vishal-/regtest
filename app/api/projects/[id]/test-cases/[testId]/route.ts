import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { testCases, testResults, testRuns } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    await ensureTablesExist();
    const { testId } = await params;
    const numericTestId = Number(testId);

    const caseList = await db
      .select()
      .from(testCases)
      .where(eq(testCases.id, numericTestId))
      .limit(1);

    if (!caseList || caseList.length === 0) {
      return NextResponse.json({ error: 'Test case not found' }, { status: 404 });
    }

    const testCase = caseList[0];

    // Fetch execution history for this test case
    const history = await db
      .select({
        resultId: testResults.id,
        status: testResults.status,
        actualResult: testResults.actualResult,
        notes: testResults.notes,
        executedAt: testResults.executedAt,
        runId: testRuns.id,
        runName: testRuns.name,
        runExecutedAt: testRuns.executedAt,
      })
      .from(testResults)
      .innerJoin(testRuns, eq(testResults.testRunId, testRuns.id))
      .where(eq(testResults.testCaseId, numericTestId))
      .orderBy(desc(testRuns.executedAt));

    return NextResponse.json({
      testCase,
      history,
    });
  } catch (error) {
    console.error('Failed to fetch test case:', error);
    return NextResponse.json({ error: 'Failed to fetch test case' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    await ensureTablesExist();
    const { testId } = await params;
    const numericTestId = Number(testId);
    const body = await request.json();
    const { title, module, priority, description, expectedResult } = body;

    await db
      .update(testCases)
      .set({
        ...(title ? { title } : {}),
        ...(module ? { module } : {}),
        ...(priority ? { priority: priority.toUpperCase() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(expectedResult ? { expectedResult } : {}),
      })
      .where(eq(testCases.id, numericTestId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update test case:', error);
    return NextResponse.json({ error: 'Failed to update test case' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    await ensureTablesExist();
    const { testId } = await params;
    const numericTestId = Number(testId);

    await db.delete(testResults).where(eq(testResults.testCaseId, numericTestId));
    await db.delete(testCases).where(eq(testCases.id, numericTestId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete test case:', error);
    return NextResponse.json({ error: 'Failed to delete test case' }, { status: 500 });
  }
}
