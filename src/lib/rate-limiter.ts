/**
 * Rate Limiting Utility
 * Prevents abuse of public endpoints (contact forms, bookings)
 */

import { LRUCache } from 'lru-cache';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

// In-memory cache for rate limiting
// Note: In production with multiple servers, use Redis instead
const cache = new LRUCache<string, number[]>({
  max: 1000,
  ttl: 60 * 60 * 1000, // 1 hour TTL
});

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP + endpoint)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Get existing requests for this identifier
  const requests = cache.get(identifier) || [];
  
  // Filter to only include requests within the current window
  const recentRequests = requests.filter(time => time > windowStart);
  
  // Check if limit exceeded
  if (recentRequests.length >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: recentRequests[0] + config.windowMs,
      totalHits: recentRequests.length
    };
  }
  
  // Add current request
  recentRequests.push(now);
  cache.set(identifier, recentRequests);
  
  return {
    allowed: true,
    remaining: config.maxRequests - recentRequests.length,
    resetTime: now + config.windowMs,
    totalHits: recentRequests.length
  };
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Public contact form submissions
  CONTACT_FORM: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 submissions per 15 minutes
  },
  
  // Public booking creation
  BOOKING: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3 // 3 bookings per 15 minutes
  },
  
  // Availability checks (more lenient)
  AVAILABILITY: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // 30 checks per minute
  },
  
  // General API (authenticated)
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  }
} as const;

/**
 * Get client IP from request
 * Note: In production, handle X-Forwarded-For headers properly
 * @param req
 */
export function getClientIP(req: Request): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Fallback (won't work reliably in serverless environments)
  return 'unknown';
}