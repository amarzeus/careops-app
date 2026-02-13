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
  if (!workspace)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const errors: string[] = [];

  const hasChannel =
    workspace.emailConfigured || workspace.smsConfigured;
  if (!hasChannel) {
    errors.push("At least one communication channel (Email, SMS, or WhatsApp) must be configured");
  }

  const serviceCount = await prisma.service.count({
    where: { workspaceId: user.workspaceId, isActive: true },
  });
  if (serviceCount === 0) {
    errors.push("At least one booking type (service) must be created");
  }

  return NextResponse.json({
    valid: errors.length === 0,
    errors,
  });
}
