import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { projects, testCases } from '@/lib/db/schema';
import { generateProjectKey } from '@/lib/utils';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureTablesExist();
    const { id } = await params;
    const numericProjectId = Number(id);

    const list = await db
      .select()
      .from(testCases)
      .where(eq(testCases.projectId, numericProjectId))
      .orderBy(testCases.caseNumber);

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
    const { id } = await params;
    const numericProjectId = Number(id);
    const body = await request.json();
    const { title, module, priority, description, expectedResult } = body;

    if (!title || !module || !priority || !expectedResult) {
      return NextResponse.json(
        { error: 'Title, module, priority and expectedResult are required' },
        { status: 400 }
      );
    }

    // Fetch project to retrieve its key initials
    const projList = await db
      .select()
      .from(projects)
      .where(eq(projects.id, numericProjectId))
      .limit(1);

    const projectKey = projList[0]?.key || (projList[0] ? generateProjectKey(projList[0].name) : 'TC');

    // Find next case number for this project
    const existingCases = await db
      .select({ caseNumber: testCases.caseNumber })
      .from(testCases)
      .where(eq(testCases.projectId, numericProjectId));

    let maxNumber = 0;
    existingCases.forEach((c) => {
      if (c.caseNumber && c.caseNumber > maxNumber) {
        maxNumber = c.caseNumber;
      }
    });

    const nextCaseNumber = maxNumber + 1;
    const testCaseCode = `${projectKey}-${nextCaseNumber}`;

    const inserted = await db
      .insert(testCases)
      .values({
        projectId: numericProjectId,
        caseNumber: nextCaseNumber,
        code: testCaseCode,
        title,
        module,
        priority: priority.toUpperCase(),
        description: description || '',
        expectedResult,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ testCase: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create test case:', error);
    return NextResponse.json({ error: 'Failed to create test case' }, { status: 500 });
  }
}
