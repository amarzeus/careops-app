import { NextResponse } from "next/server";
import { LRUCache } from "lru-cache";

interface RateLimitContext {
  id: string;
  limit: number;
  timeframe: number;
}

const rateLimitCache = new LRUCache<string, number[]>({
  max: 1000,
  ttl: 60000, // max 1 minute cache for typical rate limiting windows
});

/**
 * rateLimit validates the IP request count within a mapped timeframe context
 * returning an error response object if validation fails or null otherwise.
 */
export function rateLimit(request: Request, context: RateLimitContext) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const limitId = `${context.id}_${ip}`;

  const now = Date.now();
  const windowStart = now - context.timeframe * 1000;

  let requestTimestamps = rateLimitCache.get(limitId) || [];

  // Filter out expired timestamps
  requestTimestamps = requestTimestamps.filter((timestamp) => timestamp > windowStart);

  if (requestTimestamps.length >= context.limit) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  requestTimestamps.push(now);
  rateLimitCache.set(limitId, requestTimestamps, { ttl: context.timeframe * 1000 });

  return null;
}
