import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limiter";

describe("Rate Limiter Utility (Strict Mode)", () => {
  const mockConfig = {
    windowMs: 1000,
    maxRequests: 2,
  };

  beforeEach(() => {
    // We cannot easily clear the singleton LRUCache exported from the module
    // without implementing a clear method in the source or reloading the module.
    // For unit tests, we will use unique identifiers to ensure isolation.
  });

  it("should allow requests under the limit", () => {
    const id = "user-1";

    // Request 1
    const result1 = checkRateLimit(id, mockConfig);
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(1);
    expect(result1.totalHits).toBe(1);

    // Request 2
    const result2 = checkRateLimit(id, mockConfig);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(0);
    expect(result2.totalHits).toBe(2);
  });

  it("should block requests over the limit", () => {
    const id = "user-2"; // Unique ID

    // Hit limit
    checkRateLimit(id, mockConfig);
    checkRateLimit(id, mockConfig);

    // Exceed limit
    const result = checkRateLimit(id, mockConfig);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.totalHits).toBe(2); // Should not increment totalHits stored in valid window?
    // Wait, let's check implementation:
    // Implementation returns: totalHits: recentRequests.length
    // If recentRequests.length >= max, it returns early. NOT adding the new one.
    // So totalHits remains at max.
  });

  it("should track different users separately", () => {
    const userA = "user-A";
    const userB = "user-B";

    // Exhaust user A
    checkRateLimit(userA, mockConfig);
    checkRateLimit(userA, mockConfig);
    expect(checkRateLimit(userA, mockConfig).allowed).toBe(false);

    // User B should still be allowed
    expect(checkRateLimit(userB, mockConfig).allowed).toBe(true);
  });

  it("should reset after window expires", async () => {
    const id = "user-timeout";
    const shortConfig = { windowMs: 100, maxRequests: 1 };

    checkRateLimit(id, shortConfig); // 1/1
    expect(checkRateLimit(id, shortConfig).allowed).toBe(false); // Blocked

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(checkRateLimit(id, shortConfig).allowed).toBe(true);
  });
});
