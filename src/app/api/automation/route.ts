import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = await prisma.automationRule.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rules });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, trigger, messageTemplate, delayMinutes, isActive } =
    await req.json();
  if (!name || !trigger)
    return NextResponse.json(
      { error: "Name and trigger are required" },
      { status: 400 }
    );

  const rule = await prisma.automationRule.create({
    data: {
      name,
      trigger,
      messageTemplate,
      delayMinutes: delayMinutes || 0,
      isActive: isActive ?? true,
      workspaceId: user.workspaceId,
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
}
