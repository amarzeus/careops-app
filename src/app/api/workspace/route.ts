import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await prisma.workspace.findUnique({
    where: { id: user.workspaceId },
  });
  return NextResponse.json({ workspace });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
      ...(data.status && { status: data.status }),
      ...(data.onboardingStep !== undefined && {
        onboardingStep: data.onboardingStep,
      }),
    },
  });

  return NextResponse.json({ workspace });
}
