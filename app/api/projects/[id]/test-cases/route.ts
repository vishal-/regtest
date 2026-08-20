import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { testCases } from '@/lib/db/schema';
import { generateId } from '@/lib/utils';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id } = await params;

    const list = await db
      .select()
      .from(testCases)
      .where(eq(testCases.projectId, id))
      .orderBy(desc(testCases.createdAt));

    return NextResponse.json({ testCases: list });
  } catch (error) {
    console.error('Failed to fetch test cases:', error);
    return NextResponse.json({ error: 'Failed to fetch test cases' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id: projectId } = await params;
    const body = await request.json();
    const { title, module, priority, description, expectedResult } = body;

    if (!title || !module || !priority || !expectedResult) {
      return NextResponse.json(
        { error: 'Title, module, priority and expectedResult are required' },
        { status: 400 }
      );
    }

    const newTestCase = {
      id: generateId('tc'),
      projectId,
      title,
      module,
      priority: priority.toUpperCase(),
      description: description || '',
      expectedResult,
      createdAt: new Date().toISOString(),
    };

    await db.insert(testCases).values(newTestCase);

    return NextResponse.json({ testCase: newTestCase }, { status: 201 });
  } catch (error) {
    console.error('Failed to create test case:', error);
    return NextResponse.json({ error: 'Failed to create test case' }, { status: 500 });
  }
}
