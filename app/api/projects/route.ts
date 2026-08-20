import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { projects, testCases, testRuns } from '@/lib/db/schema';
import { generateId } from '@/lib/utils';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await ensureTablesExist();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let allProjects;
    if (userId) {
      allProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.createdAt));
    } else {
      allProjects = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.createdAt));
    }

    // Enhance with test case counts & runs count
    const enhanced = await Promise.all(
      allProjects.map(async (project) => {
        const cases = await db
          .select()
          .from(testCases)
          .where(eq(testCases.projectId, project.id));
        const runs = await db
          .select()
          .from(testRuns)
          .where(eq(testRuns.projectId, project.id));

        return {
          ...project,
          testCaseCount: cases.length,
          runCount: runs.length,
          lastRun: runs[runs.length - 1] || null,
        };
      })
    );

    return NextResponse.json({ projects: enhanced });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTablesExist();
    const body = await request.json();
    const { name, description, userId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const newProject = {
      id: generateId('prj'),
      name,
      description: description || '',
      userId: userId || 'demo-user-1',
      createdAt: new Date().toISOString(),
    };

    await db.insert(projects).values(newProject);

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
