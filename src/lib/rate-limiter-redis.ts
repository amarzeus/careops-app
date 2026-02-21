import type { RateLimitResult } from "./rate-limiter";

export interface RedisRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

interface RedisClient {
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<"OK" | null>;
}

let redisClient: RedisClient | null = null;

export function initRedisRateLimiter(client: RedisClient): void {
  redisClient = client;
}

export function isRedisConfigured(): boolean {
  return redisClient !== null;
}

export async function checkRateLimitRedis(
  identifier: string,
  config: RedisRateLimitConfig
): Promise<RateLimitResult> {
  if (!redisClient) {
    console.warn("[RateLimiter] Redis not configured, falling back to in-memory");
    const { checkRateLimit } = await import("./rate-limiter");
    return checkRateLimit(identifier, config);
  }

  const key = `${config.keyPrefix || "ratelimit"}:${identifier}`;
  const windowSeconds = Math.floor(config.windowMs / 1000);

  try {
    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    const ttl = await redisClient.ttl(key);
    const resetTime = Date.now() + ttl * 1000;

    if (current > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        totalHits: current,
        retryAfter: ttl,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - current),
      resetTime,
      totalHits: current,
    };
  } catch (error) {
    console.error("[RateLimiter] Redis error, falling back:", error);
    const { checkRateLimit } = await import("./rate-limiter");
    return checkRateLimit(identifier, config);
  }
}

export function createRedisClientFromEnv(): RedisClient | null {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

  if (!redisUrl) {
    return null;
  }

  if (redisUrl.includes("upstash.io")) {
    return createUpstashClient();
  }

  return createNodeRedisClient(redisUrl);
}

function createUpstashClient(): RedisClient {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL!;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN!;

  return {
    async incr(key: string): Promise<number> {
      const res = await fetch(`${restUrl}/incr/${key}`, {
        headers: { Authorization: `Bearer ${restToken}` },
      });
      const data = await res.json() as { result: number };
      return data.result;
    },
    async expire(key: string, seconds: number): Promise<number> {
      const res = await fetch(`${restUrl}/expire/${key}/${seconds}`, {
        headers: { Authorization: `Bearer ${restToken}` },
      });
      const data = await res.json() as { result: number };
      return data.result;
    },
    async ttl(key: string): Promise<number> {
      const res = await fetch(`${restUrl}/ttl/${key}`, {
        headers: { Authorization: `Bearer ${restToken}` },
      });
      const data = await res.json() as { result: number };
      return data.result;
    },
    async get(key: string): Promise<string | null> {
      const res = await fetch(`${restUrl}/get/${key}`, {
        headers: { Authorization: `Bearer ${restToken}` },
      });
      const data = await res.json() as { result: string | null };
      return data.result;
    },
    async set(key: string, value: string, options?: { ex?: number }): Promise<"OK" | null> {
      let url = `${restUrl}/set/${key}/${encodeURIComponent(value)}`;
      if (options?.ex) {
        url += `?ex=${options.ex}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${restToken}` },
      });
      const data = await res.json() as { result: string | null };
      return data.result as "OK" | null;
    },
  };
}

function createNodeRedisClient(_url: string): RedisClient {
  throw new Error("Node Redis client requires 'redis' package. Use Upstash for serverless or install redis package.");
}
