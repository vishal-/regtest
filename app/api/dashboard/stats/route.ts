import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { projects, testCases, testRuns, testResults } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await ensureTablesExist();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let allProjects = await db.select().from(projects);
    if (userId) {
      allProjects = allProjects.filter((p) => p.userId === userId);
    }

    const projectIds = new Set(allProjects.map((p) => p.id));

    const allCases = await db.select().from(testCases);
    const userCases = allCases.filter((c) => projectIds.has(c.projectId));

    const allRuns = await db.select().from(testRuns).orderBy(desc(testRuns.executedAt));
    const userRuns = allRuns.filter((r) => projectIds.has(r.projectId));

    const allResults = await db.select().from(testResults);
    const userRunIds = new Set(userRuns.map((r) => r.id));
    const userResults = allResults.filter((r) => userRunIds.has(r.testRunId));

    const completedResults = userResults.filter((r) => r.status === 'PASSED' || r.status === 'FAILED');
    const passedResults = userResults.filter((r) => r.status === 'PASSED');
    const globalPassRate =
      completedResults.length > 0
        ? Math.round((passedResults.length / completedResults.length) * 100)
        : 100;

    // Recent runs with project names
    const recentRuns = userRuns.slice(0, 5).map((run) => {
      const proj = allProjects.find((p) => p.id === run.projectId);
      const runRes = userResults.filter((r) => r.testRunId === run.id);
      return {
        ...run,
        projectName: proj?.name || 'Unknown Project',
        total: runRes.length,
        passed: runRes.filter((r) => r.status === 'PASSED').length,
        failed: runRes.filter((r) => r.status === 'FAILED').length,
        skipped: runRes.filter((r) => r.status === 'SKIPPED').length,
      };
    });

    return NextResponse.json({
      stats: {
        totalProjects: allProjects.length,
        totalTestCases: userCases.length,
        totalRuns: userRuns.length,
        globalPassRate,
        p0Count: userCases.filter((c) => c.priority === 'P0').length,
        p1Count: userCases.filter((c) => c.priority === 'P1').length,
      },
      recentRuns,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
