/**
 * In-memory sliding-window rate limiter for API routes.
 * Resets on server restart; use Redis (e.g. Upstash) for multi-instance production.
 */

import { NextResponse } from "next/server";

const buckets = new Map<string, number[]>();
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

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
async function callUpstash(parts: string[]): Promise<unknown> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  const url = `${UPSTASH_URL.replace(/\/$/, "")}/${parts.map((p) => encodeURIComponent(p)).join("/")}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Upstash request failed: ${res.status}`);
  }
  const payload = (await res.json()) as { result?: unknown };
  return payload.result;
}

async function rateLimitDistributed(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  const now = Date.now();
  const windowBucket = Math.floor(now / windowMs);
  const scopedKey = `rl:${key}:${windowBucket}`;

  const count = Number(await callUpstash(["incr", scopedKey]));
  if (!Number.isFinite(count)) return null;
  if (count === 1) {
    await callUpstash(["pexpire", scopedKey, String(windowMs)]);
  }
  const ttl = Number(await callUpstash(["pttl", scopedKey]));
  const resetAt = now + (Number.isFinite(ttl) && ttl > 0 ? ttl : windowMs);

  if (count > maxRequests) {
    return { success: false, remaining: 0, resetAt };
  }
  return { success: true, remaining: Math.max(0, maxRequests - count), resetAt };
}

export async function checkAiRateLimit(request: Request, userId: string | null): Promise<NextResponse | null> {
  const key = aiRateLimitKey(request, userId);
  const result =
    (await rateLimitDistributed(key, AI_RATE_WINDOW_MS, AI_RATE_MAX)) ??
    rateLimit(key, AI_RATE_WINDOW_MS, AI_RATE_MAX);
  if (!result.success) {
    return aiRateLimitExceededResponse(result);
  }
  return null;
}
