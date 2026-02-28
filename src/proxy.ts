import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "./lib/rate-limit";

// ── Public Paths ─────────────────────────────────────────────────
const publicRoutes = [
  "/login",
  "/register",
  "/verify-otp",
  "/forgot-password",
  "/book",
  "/contact",
  "/form",
  "/search",
  "/pricing",
  "/faq",
  "/privacy",
  "/terms",
  "/cookies",
  "/api/public",
  "/api/booking",
  "/api/voice/tools",
  "/api/voice/webhook",
  "/api/voice/webhook-fast",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-otp",
  "/api/auth/resend-otp",
  "/api/auth/send-sms-otp",
  "/api/auth/send-whatsapp-otp",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/google",
  "/api/test/seed",
  "/api/ai/voice",
  "/api/ai/chat",
  "/api/health",
  "/api/files",
  "/api/cron",
  "/api/webhooks",
  "/api/razorpay/webhook",
];

// ── Rate Limiting (in-memory, Edge-compatible) ───────────────────
const authAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10; // max attempts per window

const RATE_LIMITED_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/verify-otp",
];

/**
 * Checks if a request should be rate limited based on IP and path.
 *
 * @param ip - Client IP address
 * @param pathname - Request path
 * @returns true if rate limited, false otherwise
 */
function checkRateLimit(ip: string, pathname: string): boolean {
  if (!RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) return false;

  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = authAttempts.get(key);

  if (!entry || now > entry.resetAt) {
    authAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Periodic cleanup to prevent memory leak
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of authAttempts.entries()) {
      if (now > entry.resetAt) authAttempts.delete(key);
    }
  }, 60_000);
}

// ── Proxy Handler ────────────────────────────────────────────────
/**
 * Next.js 16 proxy — handles route protection, auth guards, and rate limiting.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  // Rate limit check on auth endpoints
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (checkRateLimit(ip, pathname)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "900",
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // General Public API rate limiting
  if (pathname.startsWith("/api/public") || pathname.startsWith("/api/webhooks")) {
    const limitResponse = rateLimit(request, {
      id: "public_api",
      limit: 10, // 10 requests per minute
      timeframe: 60,
    });
    if (limitResponse) return limitResponse;
  }

  // Public routes — allow without auth
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublicRoute || pathname === "/") {
    return NextResponse.next();
  }

  // Protected dashboard/app pages — redirect to login
  if (
    !token &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/inbox") ||
      pathname.startsWith("/bookings") ||
      pathname.startsWith("/forms") ||
      pathname.startsWith("/inventory") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/automation") ||
      pathname.startsWith("/files") ||
      pathname.startsWith("/voice") ||
      pathname.startsWith("/onboarding"))
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protected API routes — return 401 JSON
  if (pathname.startsWith("/api/") && !isPublicRoute && !token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Pass through with pathname header for logging
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-invoke-path", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
