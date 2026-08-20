import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { projects, projectMembers, testCases, testRuns, testResults } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await ensureTablesExist();
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'demo-user-1';
    const userEmail = body.userEmail || 'qa.lead@regressionhub.io';

    // Check if user already owns projects
    const existing = await db.select().from(projects).where(eq(projects.userId, userId));
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Projects already exist', projectId: existing[0].id });
    }

    // Create E-Commerce Web Demo Project (Key: ESC)
    const insertedProjects = await db
      .insert(projects)
      .values({
        name: 'Ecommerce Storefront & Checkout',
        key: 'ESC',
        description: 'Core web application handling customer auth, product catalog, cart, and Stripe billing.',
        userId,
        createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      })
      .returning();

    const newProject = insertedProjects[0];

    // Add creator as OWNER in project_members
    await db.insert(projectMembers).values({
      projectId: newProject.id,
      userId,
      userEmail,
      role: 'OWNER',
      addedAt: new Date().toISOString(),
    });

    // Sample Test Cases with ESC-1, ESC-2...
    const sampleCases = [
      {
        projectId: newProject.id,
        caseNumber: 1,
        code: 'ESC-1',
        module: 'Auth',
        priority: 'P0',
        title: 'User logs in successfully with valid Google OAuth',
        description: '1. Navigate to /login\n2. Click "Continue with Google"\n3. Authenticate with valid Google credentials\n4. Verify redirect to /dashboard and user profile info displayed.',
        expectedResult: 'User session is created, redirected to /dashboard, auth cookies set.',
        createdAt: new Date().toISOString(),
      },
      {
        projectId: newProject.id,
        caseNumber: 2,
        code: 'ESC-2',
        module: 'Auth',
        priority: 'P1',
        title: 'Invalid password shows friendly error message',
        description: '1. Navigate to /login\n2. Enter registered email with invalid password\n3. Click Submit',
        expectedResult: 'Error alert "Invalid credentials" appears, form does not clear email field.',
        createdAt: new Date().toISOString(),
      },
      {
        projectId: newProject.id,
        caseNumber: 3,
        code: 'ESC-3',
        module: 'Billing',
        priority: 'P0',
        title: 'Complete credit card checkout with 3D Secure verification',
        description: '1. Add items to cart\n2. Proceed to checkout\n3. Enter valid test Visa card\n4. Complete 3DS pop-up challenge',
        expectedResult: 'Payment succeeds, order confirmation # generated, receipt email queued.',
        createdAt: new Date().toISOString(),
      },
      {
        projectId: newProject.id,
        caseNumber: 4,
        code: 'ESC-4',
        module: 'Checkout',
        priority: 'P0',
        title: 'Apply 20% promo discount code at checkout',
        description: '1. Add $100 item to cart\n2. In promo code input, enter "SAVE20"\n3. Click Apply',
        expectedResult: 'Cart subtotal recalculates to $80, discount line item displays "-$20.00".',
        createdAt: new Date().toISOString(),
      },
      {
        projectId: newProject.id,
        caseNumber: 5,
        code: 'ESC-5',
        module: 'Billing',
        priority: 'P2',
        title: 'Download PDF invoice from order history',
        description: '1. Go to Account > Orders\n2. Click "Download Invoice" on completed order',
        expectedResult: 'Valid PDF file downloads with matching items, tax breakdown, and VAT info.',
        createdAt: new Date().toISOString(),
      },
      {
        projectId: newProject.id,
        caseNumber: 6,
        code: 'ESC-6',
        module: 'Cart',
        priority: 'P1',
        title: 'Cart persistence across browser tab refresh',
        description: '1. Add 2 items to cart\n2. Reload browser tab\n3. Check cart item count',
        expectedResult: 'Cart count remains 2 and items are retained from local state / cookie.',
        createdAt: new Date().toISOString(),
      },
    ];

    const insertedCases = [];
    for (const tc of sampleCases) {
      const inserted = await db.insert(testCases).values(tc).returning();
      insertedCases.push(inserted[0]);
    }

    // Create a sample completed run
    const insertedRuns = await db
      .insert(testRuns)
      .values({
        projectId: newProject.id,
        name: 'Sprint 24 Regression - Smoke Suite',
        status: 'PASSED',
        executedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 15 * 60 * 1000).toISOString(),
      })
      .returning();

    const sampleRun = insertedRuns[0];

    for (let i = 0; i < insertedCases.length; i++) {
      const tc = insertedCases[i];
      await db.insert(testResults).values({
        testRunId: sampleRun.id,
        testCaseId: tc.id,
        status: i === 4 ? 'SKIPPED' : 'PASSED',
        actualResult: i === 4 ? 'PDF service mocked in staging' : 'Verified as expected in Chrome v128',
        notes: null,
        executedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, projectId: newProject.id, runId: sampleRun.id });
  } catch (error) {
    console.error('Seed failed:', error);
    return NextResponse.json({ error: 'Failed to seed sample data' }, { status: 500 });
  }
}
