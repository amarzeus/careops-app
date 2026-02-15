import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 *
 * @param request
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = ["/login", "/register", "/verify-otp", "/forgot-password", "/book", "/contact", "/form", "/api/public", "/api/auth/login", "/api/auth/register", "/api/auth/verify-otp", "/api/auth/resend-otp", "/api/auth/send-sms-otp", "/api/auth/send-whatsapp-otp", "/api/auth/forgot-password", "/api/auth/google", "/api/test/seed", "/api/ai/voice", "/api/ai/chat", "/api/health"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute || pathname === "/") {
    return NextResponse.next();
  }

  // Protected routes
  if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/inbox") || pathname.startsWith("/bookings") || pathname.startsWith("/forms") || pathname.startsWith("/inventory") || pathname.startsWith("/staff") || pathname.startsWith("/settings") || pathname.startsWith("/automation") || pathname.startsWith("/onboarding"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // API routes that need auth (except public ones)
  if (pathname.startsWith("/api/") && !isPublicRoute && !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
