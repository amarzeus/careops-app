import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Check if email is configured via environment variables
 */
function isEmailConfigured(): boolean {
  return !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_FROM
  );
}

/**
 * Check if SMS is configured via environment variables
 */
function isSMSConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

/**
 *
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await prisma.workspace.findUnique({
    where: { id: user.workspaceId },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Check environment variables for email/SMS configuration
  const emailConfiguredViaEnv = isEmailConfigured();
  const smsConfiguredViaEnv = isSMSConfigured();

  // Return workspace with configuration status based on DB flag OR env vars
  const workspaceWithConfig = {
    ...workspace,
    // If DB flag is true OR env vars are configured, show as configured
    emailConfigured: workspace.emailConfigured || emailConfiguredViaEnv,
    smsConfigured: workspace.smsConfigured || smsConfiguredViaEnv,
    // Include flags indicating if configuration comes from environment
    emailConfiguredViaEnv,
    smsConfiguredViaEnv,
  };

  return NextResponse.json({ workspace: workspaceWithConfig });
}

/**
 *
 * @param req
 */
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  const workspace = await prisma.workspace.update({
    where: { id: user.workspaceId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.contactEmail !== undefined && {
        contactEmail: data.contactEmail,
      }),
      ...(data.contactPhone !== undefined && {
        contactPhone: data.contactPhone,
      }),
      ...(data.emailProvider !== undefined && {
        emailProvider: data.emailProvider,
      }),
      ...(data.emailApiKey !== undefined && { emailApiKey: data.emailApiKey }),
      ...(data.emailFromName !== undefined && {
        emailFromName: data.emailFromName,
      }),
      ...(data.emailFromAddress !== undefined && {
        emailFromAddress: data.emailFromAddress,
      }),
      ...(data.emailConfigured !== undefined && {
        emailConfigured: data.emailConfigured,
      }),
      ...(data.smsProvider !== undefined && { smsProvider: data.smsProvider }),
      ...(data.smsApiKey !== undefined && { smsApiKey: data.smsApiKey }),
      ...(data.smsFromNumber !== undefined && {
        smsFromNumber: data.smsFromNumber,
      }),
      ...(data.smsConfigured !== undefined && {
        smsConfigured: data.smsConfigured,
      }),
      ...(data.whatsappProvider !== undefined && {
        whatsappProvider: data.whatsappProvider,
      }),
      ...(data.whatsappIntegratedNumber !== undefined && {
        whatsappIntegratedNumber: data.whatsappIntegratedNumber,
      }),
      ...(data.whatsappConfigured !== undefined && {
        whatsappConfigured: data.whatsappConfigured,
      }),
      ...(data.status && { status: data.status }),
      ...(data.onboardingStep !== undefined && {
        onboardingStep: data.onboardingStep,
      }),
    },
  });

  return NextResponse.json({ workspace });
}
