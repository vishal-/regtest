import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { projects, projectMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id } = await params;
    const numericProjectId = Number(id);

    const members = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, numericProjectId));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
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
    const { callerUserId, userEmail, memberUserId, role } = body;

    // Verify that the caller is the project creator/owner
    const projectList = await db
      .select()
      .from(projects)
      .where(eq(projects.id, numericProjectId))
      .limit(1);

    if (!projectList.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectList[0];
    if (callerUserId && project.userId !== callerUserId) {
      return NextResponse.json(
        { error: 'Forbidden: Only the project creator can add users to this project.' },
        { status: 403 }
      );
    }

    if (!userEmail && !memberUserId) {
      return NextResponse.json(
        { error: 'User email or User ID is required' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existing = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, numericProjectId),
          userEmail
            ? eq(projectMembers.userEmail, userEmail)
            : eq(projectMembers.userId, memberUserId)
        )
      );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'User is already a member of this project' },
        { status: 409 }
      );
    }

    const newMember = {
      projectId: numericProjectId,
      userId: memberUserId || userEmail || 'user_' + Math.random().toString(36).substring(2, 8),
      userEmail: userEmail || null,
      role: role || 'MEMBER',
      addedAt: new Date().toISOString(),
    };

    const inserted = await db.insert(projectMembers).values(newMember).returning();

    return NextResponse.json({ member: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to add project member:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
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
    const memberId = searchParams.get('memberId');
    const callerUserId = searchParams.get('callerUserId');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // Verify owner
    const projectList = await db
      .select()
      .from(projects)
      .where(eq(projects.id, numericProjectId))
      .limit(1);

    if (!projectList.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (callerUserId && projectList[0].userId !== callerUserId) {
      return NextResponse.json(
        { error: 'Only the project creator can remove members.' },
        { status: 403 }
      );
    }

    await db.delete(projectMembers).where(eq(projectMembers.id, Number(memberId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
