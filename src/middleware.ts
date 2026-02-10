import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = ["/login", "/register", "/verify-otp", "/book", "/contact", "/form", "/api/public", "/api/auth/login", "/api/auth/register", "/api/auth/verify-otp", "/api/auth/resend-otp", "/api/auth/send-sms-otp", "/api/auth/google"];
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
