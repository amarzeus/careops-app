import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Check if email is available
 * Priority: 1) Workspace flag, 2) Environment variables
 * @param workspace
 * @param workspace.emailConfigured
 */
function isEmailAvailable(workspace: { emailConfigured: boolean }): boolean {
  if (workspace.emailConfigured) return true;
  const hasEmailEnv = !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_FROM
  );
  return hasEmailEnv;
}

/**
 * Check if SMS is available
 * Priority: 1) Workspace flag, 2) Environment variables
 * @param workspace
 * @param workspace.smsConfigured
 */
function isSMSAvailable(workspace: { smsConfigured: boolean }): boolean {
  if (workspace.smsConfigured) return true;
  const hasSMSEnv = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
  return hasSMSEnv;
}

/**
 *
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.workspaceId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await prisma.workspace.findUnique({
      where: { id: user.workspaceId },
    });
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const errors: string[] = [];

    // Check 1: At least one communication channel configured
    const hasChannel = isEmailAvailable(workspace) || isSMSAvailable(workspace);
    if (!hasChannel) {
      errors.push(
        "At least one communication channel (Email, SMS, or WhatsApp) must be configured"
      );
    }

    // Check 2: At least one active service exists
    const serviceCount = await prisma.service.count({
      where: { workspaceId: user.workspaceId, isActive: true },
    });
    if (serviceCount === 0) {
      errors.push("At least one booking type (service) must be created");
    }

    // Check 3: CRITICAL FIX - All services must have availability defined
    const services = await prisma.service.findMany({
      where: {
        workspaceId: user.workspaceId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        availableDays: true,
        startTime: true,
        endTime: true,
      },
    });

    const servicesWithoutAvailability = services.filter(
      (service) =>
        !service.availableDays ||
        service.availableDays === "" ||
        !service.startTime ||
        service.startTime === "" ||
        !service.endTime ||
        service.endTime === ""
    );

    if (servicesWithoutAvailability.length > 0) {
      const serviceNames = servicesWithoutAvailability.map((s) => s.name).join(", ");
      errors.push(`All active services must have availability defined. Missing: ${serviceNames}`);
    }

    return NextResponse.json({
      valid: errors.length === 0,
      errors,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Validation failed", details: String(error) },
      { status: 500 }
    );
  }
}
