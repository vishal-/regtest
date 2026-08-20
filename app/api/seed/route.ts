import { NextRequest, NextResponse } from 'next/server';
import { db, ensureTablesExist } from '@/lib/db';
import { projects, testCases, testRuns, testResults } from '@/lib/db/schema';
import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await ensureTablesExist();
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'demo-user-1';

    // Check if demo project already exists
    const existing = await db.select().from(projects).where(eq(projects.userId, userId));
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Projects already exist', projectId: existing[0].id });
    }

    // Create E-Commerce Web Demo Project
    const projectId = generateId('prj');
    await db.insert(projects).values({
      id: projectId,
      name: 'E-Commerce Storefront & Checkout',
      description: 'Core web application handling customer auth, product catalog, cart, and Stripe billing.',
      userId,
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    });

    // Sample Test Cases
    const sampleCases = [
      {
        id: generateId('tc'),
        projectId,
        module: 'Auth',
        priority: 'P0',
        title: 'User logs in successfully with valid Google OAuth',
        description: '1. Navigate to /login\n2. Click "Continue with Google"\n3. Authenticate with valid Google credentials\n4. Verify redirect to /dashboard and user profile info displayed.',
        expectedResult: 'User session is created, redirected to /dashboard, auth cookies set.',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('tc'),
        projectId,
        module: 'Auth',
        priority: 'P1',
        title: 'Invalid password shows friendly error message',
        description: '1. Navigate to /login\n2. Enter registered email with invalid password\n3. Click Submit',
        expectedResult: 'Error alert "Invalid credentials" appears, form does not clear email field.',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('tc'),
        projectId,
        module: 'Billing',
        priority: 'P0',
        title: 'Complete credit card checkout with 3D Secure verification',
        description: '1. Add items to cart\n2. Proceed to checkout\n3. Enter valid test Visa card\n4. Complete 3DS pop-up challenge',
        expectedResult: 'Payment succeeds, order confirmation # generated, receipt email queued.',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('tc'),
        projectId,
        module: 'Checkout',
        priority: 'P0',
        title: 'Apply 20% promo discount code at checkout',
        description: '1. Add $100 item to cart\n2. In promo code input, enter "SAVE20"\n3. Click Apply',
        expectedResult: 'Cart subtotal recalculates to $80, discount line item displays "-$20.00".',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('tc'),
        projectId,
        module: 'Billing',
        priority: 'P2',
        title: 'Download PDF invoice from order history',
        description: '1. Go to Account > Orders\n2. Click "Download Invoice" on completed order',
        expectedResult: 'Valid PDF file downloads with matching items, tax breakdown, and VAT info.',
        createdAt: new Date().toISOString(),
      },
      {
        id: generateId('tc'),
        projectId,
        module: 'Cart',
        priority: 'P1',
        title: 'Cart persistence across browser tab refresh',
        description: '1. Add 2 items to cart\n2. Reload browser tab\n3. Check cart item count',
        expectedResult: 'Cart count remains 2 and items are retained from local state / cookie.',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const tc of sampleCases) {
      await db.insert(testCases).values(tc);
    }

    // Create a sample completed run
    const runId = generateId('run');
    await db.insert(testRuns).values({
      id: runId,
      projectId,
      name: 'Sprint 24 Regression - Smoke Suite',
      status: 'PASSED',
      executedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 15 * 60 * 1000).toISOString(),
    });

    for (let i = 0; i < sampleCases.length; i++) {
      const tc = sampleCases[i];
      await db.insert(testResults).values({
        id: generateId('res'),
        testRunId: runId,
        testCaseId: tc.id,
        status: i === 4 ? 'SKIPPED' : 'PASSED',
        actualResult: i === 4 ? 'PDF service mocked in staging' : 'Verified as expected in Chrome v128',
        notes: null,
        executedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, projectId, runId });
  } catch (error) {
    console.error('Seed failed:', error);
    return NextResponse.json({ error: 'Failed to seed sample data' }, { status: 500 });
  }
}
