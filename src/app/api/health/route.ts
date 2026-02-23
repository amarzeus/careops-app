import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isVapiConfigured } from "@/lib/vapi";

/**
 *
 */
export async function GET() {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "unknown",
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: false,
      vapi: false,
    },
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = true;
  } catch (_error) {
    checks.checks.database = false;
    checks.status = "degraded";
  }

  // Check VAPI configuration
  checks.checks.vapi = isVapiConfigured();

  const statusCode = checks.status === "healthy" ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}
