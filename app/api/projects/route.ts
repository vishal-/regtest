import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { projects, projectMembers, testCases, testRuns } from '@/lib/db/schema';
import { generateProjectKey } from '@/lib/utils';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await ensureTablesExist();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    let allProjects: (typeof projects.$inferSelect)[] = [];

    if (userId || userEmail) {
      // Find all project IDs where user is a registered member
      const memberRows = await db.select().from(projectMembers);
      const accessibleProjectIds = new Set<number>();

      memberRows.forEach((m) => {
        if ((userId && m.userId === userId) || (userEmail && m.userEmail === userEmail)) {
          accessibleProjectIds.add(m.projectId);
        }
      });

      // Find projects owned by user OR in member list
      const allRows = await db.select().from(projects).orderBy(desc(projects.createdAt));
      allProjects = allRows.filter(
        (p) => (userId && p.userId === userId) || accessibleProjectIds.has(p.id)
      );
    } else {
      allProjects = await db
        .select()
        .from(projects)
        .orderBy(desc(projects.createdAt));
    }

    // Enhance with test case counts, runs count, and role
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

        const isOwner = userId ? project.userId === userId : true;

        return {
          ...project,
          key: project.key || generateProjectKey(project.name),
          isOwner,
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
    const { name, description, key, userId, userEmail } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const creatorId = userId || 'demo-user-1';
    const now = new Date().toISOString();
    const projectKey = generateProjectKey(name, key);

    if (!projectKey || projectKey.length < 2) {
      return NextResponse.json({ error: 'A valid project key/initials of at least 2 characters is mandatory' }, { status: 400 });
    }

    // Check if project with same name or key exists
    const existingName = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.name, name.trim()))
      .limit(1);
    if (existingName.length > 0) {
      return NextResponse.json(
        { error: `A project with the name "${name.trim()}" already exists. Project names must be unique.` },
        { status: 409 }
      );
    }

    const existingKey = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.key, projectKey))
      .limit(1);
    if (existingKey.length > 0) {
      return NextResponse.json(
        { error: `A project with the key "${projectKey}" already exists. Project keys must be unique.` },
        { status: 409 }
      );
    }

    const insertResult = await db
      .insert(projects)
      .values({
        name: name.trim(),
        key: projectKey,
        description: description ? description.trim() : '',
        userId: creatorId,
        createdAt: now,
      })
      .returning();

    const newProject = insertResult[0];

    // Automatically add creator as OWNER in project_members
    await db.insert(projectMembers).values({
      projectId: newProject.id,
      userId: creatorId,
      userEmail: userEmail || null,
      role: 'OWNER',
      addedAt: now,
    });

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create project:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('UNIQUE constraint failed') || msg.includes('idx_projects_key')) {
      return NextResponse.json(
        { error: 'A project with this name or key already exists. Both must be unique.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
