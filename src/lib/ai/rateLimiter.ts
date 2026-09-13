/**
 * PIECHEM Server-Side Rate Limiter
 * In-memory sliding-window rate limiter to protect AI endpoints against abuse,
 * excessive token consumption, and rapid-fire requests.
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
  lastReset: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now - record.lastReset > 10 * 60 * 1000 && record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  cleanupTimer.unref?.();
}

/**
 * Extract client identifier for rate limiting:
 * Prefers authenticated studentId, falls back to IP address or header.
 */
export function getClientIdentifier(req: NextRequest, studentId?: string | null): string {
  if (studentId) return `student:${studentId}`;
  
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return `ip:${ip}`;
  }
  
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp}`;

  return "ip:anonymous-client";
}

/**
 * Check if the given client has exceeded their allowed quota.
 * @param identifier Unique client key (student ID or IP)
 * @param limit Maximum allowed requests within the window
 * @param windowMs Window duration in milliseconds (default 60,000ms = 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  let record = rateLimitStore.get(identifier);

  if (!record) {
    record = { timestamps: [], lastReset: now };
    rateLimitStore.set(identifier, record);
  }

  // Filter timestamps within the sliding window
  record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfterMs = windowMs - (now - oldestTimestamp);
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    retryAfterSeconds: 0
  };
}

/**
 * Helper to generate standard 429 response when rate limit is exceeded
 */
export function createRateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      error: "Rate limit exceeded. Please wait a moment before sending more AI requests.",
      message: `Too many study requests. Please try again in ${retryAfterSeconds} second(s).`,
      retryAfter: retryAfterSeconds
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
        "X-RateLimit-Limit": "30",
        "X-RateLimit-Remaining": "0"
      }
    }
  );
}
