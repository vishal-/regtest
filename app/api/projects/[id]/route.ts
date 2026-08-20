import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { projects, testCases, testRuns, testResults } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id } = await params;

    const projectList = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (!projectList || projectList.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectList[0];

    const cases = await db
      .select()
      .from(testCases)
      .where(eq(testCases.projectId, id))
      .orderBy(desc(testCases.createdAt));

    const runs = await db
      .select()
      .from(testRuns)
      .where(eq(testRuns.projectId, id))
      .orderBy(desc(testRuns.executedAt));

    // Get stats for each run
    const runsWithStats = await Promise.all(
      runs.map(async (run) => {
        const results = await db
          .select()
          .from(testResults)
          .where(eq(testResults.testRunId, run.id));

        const passed = results.filter((r) => r.status === 'PASSED').length;
        const failed = results.filter((r) => r.status === 'FAILED').length;
        const skipped = results.filter((r) => r.status === 'SKIPPED').length;
        const pending = results.filter((r) => r.status === 'PENDING').length;

        return {
          ...run,
          totalTests: results.length,
          passed,
          failed,
          skipped,
          pending,
        };
      })
    );

    return NextResponse.json({
      project,
      testCases: cases,
      testRuns: runsWithStats,
    });
  } catch (error) {
    console.error('Failed to fetch project details:', error);
    return NextResponse.json({ error: 'Failed to fetch project details' }, { status: 500 });
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
    const { name, description } = body;

    await db
      .update(projects)
      .set({
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
      })
      .where(eq(projects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id } = await params;

    // Delete associated test cases & runs
    await db.delete(testCases).where(eq(testCases.projectId, id));
    await db.delete(testRuns).where(eq(testRuns.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
