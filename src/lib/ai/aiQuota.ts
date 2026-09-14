import prisma from '@/lib/prisma';
import { hasPremiumAccess } from '@/lib/subscription';
import { NextResponse } from 'next/server';

export const DAILY_FREE_AI_LIMIT = 5;

export interface AiQuotaResult {
  allowed: boolean;
  isUnlimited: boolean;
  remaining: number;
  totalLimit: number;
  dailyLimit: number;
  queriesUsed: number;
  requiresSubscription?: boolean;
  isCustomKey?: boolean;
  error?: string;
}

/**
 * Checks whether a given reset date represents a calendar day prior to today (UTC).
 */
function isNewCalendarDay(lastReset: Date | null | undefined): boolean {
  if (!lastReset) return true;
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const lastResetStr = new Date(lastReset).toISOString().slice(0, 10);
  return todayStr !== lastResetStr;
}

/**
 * Consumes 1 AI query from the student's daily quota.
 * - Paid subscribers have UNLIMITED access.
 * - If user provides their own personal Gemini API key, it is NOT counted against the quota.
 * - Free users are capped at DAILY_FREE_AI_LIMIT (5 queries/day).
 */
export async function consumeAiQuota(
  studentId?: string | null,
  userApiKey?: string | null
): Promise<AiQuotaResult> {
  // If student provided their own Gemini API key, don't charge quota
  if (userApiKey && typeof userApiKey === 'string' && userApiKey.trim().length > 10) {
    return {
      allowed: true,
      isUnlimited: true,
      remaining: 999,
      totalLimit: 999,
      dailyLimit: 999,
      queriesUsed: 0,
      isCustomKey: true
    };
  }

  if (!studentId) {
    return {
      allowed: false,
      isUnlimited: false,
      remaining: 0,
      totalLimit: DAILY_FREE_AI_LIMIT,
      dailyLimit: DAILY_FREE_AI_LIMIT,
      queriesUsed: DAILY_FREE_AI_LIMIT,
      requiresSubscription: true,
      error: 'Please log in to use PIECHEM AI.'
    };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      aiQueriesToday: true,
      aiLastResetDate: true
    }
  });

  if (!student) {
    return {
      allowed: false,
      isUnlimited: false,
      remaining: 0,
      totalLimit: DAILY_FREE_AI_LIMIT,
      dailyLimit: DAILY_FREE_AI_LIMIT,
      queriesUsed: DAILY_FREE_AI_LIMIT,
      requiresSubscription: true,
      error: 'Student account not found.'
    };
  }

  // Check if subscriber is PAID or COMPLIMENTARY
  const isPaid = hasPremiumAccess(student.subscriptionStatus, student.subscriptionExpiresAt);
  if (isPaid) {
    return {
      allowed: true,
      isUnlimited: true,
      remaining: 999,
      totalLimit: 999,
      dailyLimit: 999,
      queriesUsed: student.aiQueriesToday || 0
    };
  }

  // Free Tier logic
  const shouldReset = isNewCalendarDay(student.aiLastResetDate);
  const currentCount = shouldReset ? 0 : (student.aiQueriesToday || 0);

  if (currentCount >= DAILY_FREE_AI_LIMIT) {
    return {
      allowed: false,
      isUnlimited: false,
      remaining: 0,
      totalLimit: DAILY_FREE_AI_LIMIT,
      dailyLimit: DAILY_FREE_AI_LIMIT,
      queriesUsed: currentCount,
      requiresSubscription: true,
      error: `Daily free AI limit reached (${DAILY_FREE_AI_LIMIT}/${DAILY_FREE_AI_LIMIT}). Upgrade to PIECHEM Gold for unlimited AI queries or return tomorrow!`
    };
  }

  // Increment usage atomically
  const updatedCount = currentCount + 1;
  await prisma.student.update({
    where: { id: studentId },
    data: {
      aiQueriesToday: shouldReset ? 1 : { increment: 1 },
      aiLastResetDate: new Date()
    }
  });

  return {
    allowed: true,
    isUnlimited: false,
    remaining: Math.max(0, DAILY_FREE_AI_LIMIT - updatedCount),
    totalLimit: DAILY_FREE_AI_LIMIT,
    dailyLimit: DAILY_FREE_AI_LIMIT,
    queriesUsed: updatedCount
  };
}

/**
 * Returns current quota without incrementing (for UI status badges and dashboard widgets).
 */
export async function getAiQuotaStatus(studentId?: string | null): Promise<AiQuotaResult> {
  if (!studentId) {
    return {
      allowed: false,
      isUnlimited: false,
      remaining: 0,
      totalLimit: DAILY_FREE_AI_LIMIT,
      dailyLimit: DAILY_FREE_AI_LIMIT,
      queriesUsed: 0
    };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      aiQueriesToday: true,
      aiLastResetDate: true
    }
  });

  if (!student) {
    return {
      allowed: false,
      isUnlimited: false,
      remaining: 0,
      totalLimit: DAILY_FREE_AI_LIMIT,
      dailyLimit: DAILY_FREE_AI_LIMIT,
      queriesUsed: 0
    };
  }

  const isPaid = hasPremiumAccess(student.subscriptionStatus, student.subscriptionExpiresAt);
  if (isPaid) {
    return {
      allowed: true,
      isUnlimited: true,
      remaining: 999,
      totalLimit: 999,
      dailyLimit: 999,
      queriesUsed: student.aiQueriesToday || 0
    };
  }

  const shouldReset = isNewCalendarDay(student.aiLastResetDate);
  const currentCount = shouldReset ? 0 : (student.aiQueriesToday || 0);

  return {
    allowed: currentCount < DAILY_FREE_AI_LIMIT,
    isUnlimited: false,
    remaining: Math.max(0, DAILY_FREE_AI_LIMIT - currentCount),
    totalLimit: DAILY_FREE_AI_LIMIT,
    dailyLimit: DAILY_FREE_AI_LIMIT,
    queriesUsed: currentCount,
    requiresSubscription: currentCount >= DAILY_FREE_AI_LIMIT
  };
}

/**
 * Standard HTTP 403 Response for exhausted AI Quota
 */
export function createAiQuotaExceededResponse(quota: AiQuotaResult): NextResponse {
  return NextResponse.json(
    {
      error: quota.error || 'Daily free AI quota reached.',
      requiresSubscription: true,
      quota: {
        queriesUsed: quota.queriesUsed,
        totalLimit: quota.totalLimit,
        dailyLimit: quota.totalLimit,
        remaining: quota.remaining,
        isUnlimited: quota.isUnlimited
      }
    },
    { status: 403 }
  );
}
