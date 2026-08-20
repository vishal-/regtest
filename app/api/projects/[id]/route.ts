import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { projects, projectMembers, testCases, testRuns, testResults } from '@/lib/db/schema';
import { eq, desc, and, ne } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id } = await params;
    const numericProjectId = Number(id);

    if (isNaN(numericProjectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const callerUserId = searchParams.get('userId');
    const callerUserEmail = searchParams.get('userEmail');

    const projectList = await db
      .select()
      .from(projects)
      .where(eq(projects.id, numericProjectId))
      .limit(1);

    if (!projectList || projectList.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectList[0];

    // Fetch members
    const members = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, numericProjectId));

    // Access check if userId/email provided
    const isOwner = callerUserId ? project.userId === callerUserId : true;
    const isMember = members.some(
      (m) =>
        (callerUserId && m.userId === callerUserId) ||
        (callerUserEmail && m.userEmail === callerUserEmail)
    );

    if (callerUserId && !isOwner && !isMember) {
      return NextResponse.json(
        { error: 'Access denied. You are not a member of this project.' },
        { status: 403 }
      );
    }

    const cases = await db
      .select()
      .from(testCases)
      .where(eq(testCases.projectId, numericProjectId))
      .orderBy(desc(testCases.createdAt));

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

    const latestRunResults = runs.length > 0
      ? await db
          .select()
          .from(testResults)
          .where(eq(testResults.testRunId, runs[0].id))
      : [];

    const latestResultMap = new Map<number, string>();
    latestRunResults.forEach((r) => {
      latestResultMap.set(r.testCaseId, r.status);
    });

    const enhancedCases = cases.map((tc) => ({
      ...tc,
      code: tc.code || `${project.key || 'TC'}-${tc.caseNumber || tc.id}`,
      lastRunStatus: latestResultMap.get(tc.id) || null,
    }));

    return NextResponse.json({
      project,
      isOwner,
      members,
      testCases: enhancedCases,
      testRuns: runsWithStats,
      lastRun: runsWithStats[0] || null,
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
    const numericProjectId = Number(id);
    const body = await request.json();
    const { name, description, userId } = body;

    const projectList = await db
      .select()
      .from(projects)
      .where(eq(projects.id, numericProjectId))
      .limit(1);

    if (!projectList.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (userId && projectList[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Only the project creator can edit project settings' },
        { status: 403 }
      );
    }

    if (name && name.trim() !== projectList[0].name) {
      const duplicateName = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(ne(projects.id, numericProjectId), eq(projects.name, name.trim())))
        .limit(1);

      if (duplicateName.length > 0) {
        return NextResponse.json(
          { error: `A project with the name "${name.trim()}" already exists. Project names must be unique.` },
          { status: 409 }
        );
      }
    }

    await db
      .update(projects)
      .set({
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
      })
      .where(eq(projects.id, numericProjectId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to update project:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('UNIQUE constraint failed') || msg.includes('idx_projects')) {
      return NextResponse.json(
        { error: 'A project with this name or key already exists. Both must be unique.' },
        { status: 409 }
      );
    }
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
    const numericProjectId = Number(id);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const projectList = await db
      .select()
      .from(projects)
      .where(eq(projects.id, numericProjectId))
      .limit(1);

    if (!projectList.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (userId && projectList[0].userId !== userId) {
      return NextResponse.json(
        { error: 'Only the project creator can delete this project' },
        { status: 403 }
      );
    }

    // Delete associated test cases, runs, and members
    const runs = await db.select({ id: testRuns.id }).from(testRuns).where(eq(testRuns.projectId, numericProjectId));
    for (const r of runs) {
      await db.delete(testResults).where(eq(testResults.testRunId, r.id));
    }
    await db.delete(testRuns).where(eq(testRuns.projectId, numericProjectId));
    await db.delete(testCases).where(eq(testCases.projectId, numericProjectId));
    await db.delete(projectMembers).where(eq(projectMembers.projectId, numericProjectId));
    await db.delete(projects).where(eq(projects.id, numericProjectId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
