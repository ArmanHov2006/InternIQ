/**
 * In-memory sliding-window rate limiter for API routes.
 * Resets on server restart; use Redis (e.g. Upstash) for multi-instance production.
 */

import { NextResponse } from "next/server";

const buckets = new Map<string, number[]>();

const MAX_MAP_KEYS = 50_000;

function pruneBucket(key: string, windowStart: number) {
  const ts = buckets.get(key);
  if (!ts) return;
  while (ts.length > 0 && ts[0]! < windowStart) {
    ts.shift();
  }
  if (ts.length === 0) {
    buckets.delete(key);
  }
}

function occasionalSweep(windowMs: number) {
  if (buckets.size < MAX_MAP_KEYS) return;
  const cutoff = Date.now() - windowMs;
  buckets.forEach((ts, key) => {
    while (ts.length > 0 && ts[0]! < cutoff) {
      ts.shift();
    }
    if (ts.length === 0) buckets.delete(key);
  });
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  /** Unix ms when the current window slot frees (for Retry-After) */
  resetAt: number;
};

export function rateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  occasionalSweep(windowMs);

  pruneBucket(key, windowStart);
  let timestamps = buckets.get(key);
  if (!timestamps) {
    timestamps = [];
    buckets.set(key, timestamps);
  }

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0]!;
    return {
      success: false,
      remaining: 0,
      resetAt: oldest + windowMs,
    };
  }

  timestamps.push(now);
  return {
    success: true,
    remaining: maxRequests - timestamps.length,
    resetAt: now + windowMs,
  };
}

/** Client IP for unauthenticated rate limiting (Vercel / proxies). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function aiRateLimitKey(request: Request, userId: string | null): string {
  if (userId) return `ai:user:${userId}`;
  return `ai:ip:${getClientIp(request)}`;
}

/** 20 requests per minute per user (or per IP if anonymous). */
export const AI_RATE_WINDOW_MS = 60_000;
export const AI_RATE_MAX = 20;

export function aiRateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const retrySec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return NextResponse.json(
    {
      error: "Too many requests. Please try again in a minute.",
      retryAfter: retrySec,
    },
    { status: 429, headers: { "Retry-After": String(retrySec) } }
  );
}

/** Returns 429 response if over limit, otherwise null. */
export function checkAiRateLimit(request: Request, userId: string | null): NextResponse | null {
  const key = aiRateLimitKey(request, userId);
  const result = rateLimit(key, AI_RATE_WINDOW_MS, AI_RATE_MAX);
  if (!result.success) {
    return aiRateLimitExceededResponse(result);
  }
  return null;
}
